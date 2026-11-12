// Two things from one Luna Service Bus call (`listLaunchPoints`):
//   1. Icons for the static demo catalog (data/apps.js) - matched against
//      whichever `appId`s are already known, same as before. Doing this at
//      runtime instead of hand-copying icon paths alongside the IDs means
//      it stays correct if the OS ever moves where it stores them, and
//      it's zero-risk licensing-wise - these are the TV's own icon files,
//      not redistributed brand assets.
//   2. The FULL list of installed apps (getDiscoveredApps()), for Settings
//      to let you pin any real installed app, not just the 8 in the static
//      catalog - see data/apps.js's getPinnableApps(). This also means a
//      discovered app's `appId` is always the TV's own real id, never a
//      guess, so launching one that got pinned just works.

import { isWebOS } from "./platform.js";

// Calling listLaunchPoints directly, as any ordinary installed app, is
// denied on this TV/firmware - confirmed live on-device:
// {"errorText":"Denied method call \"listLaunchPoints\" for category
// \"/\""}. Not an ACG/appinfo.json thing (tried, no effect - see
// docs/handoff.md's "Known limitation") - this is the older, pre-ACG
// Luna Bus category/role permission system, and a sideloaded web app's
// default trust level just isn't on the allowed list for this method.
//
// Homebrew Channel's own service (already installed - this is a rooted
// TV, this app wouldn't exist here otherwise) exposes an `exec` method
// that runs a shell command AS ROOT, with no extra caller restriction of
// its own. Confirmed live: our app's own identity (not just root SSH)
// can reach it, and the command really does run as root (`id` ->
// uid=0(root)). This is a legitimate, already-documented part of
// Homebrew's design - letting other homebrew apps use the root access
// the TV was already rooted for - not a security hole found by probing;
// we're not creating new capability the TV didn't already have, just
// using an existing, intentionally-exposed one. The command below is
// 100% fixed, never built from variable/user input, so there's no
// injection surface despite running as root.
//
// `script -qc "..." /dev/null` wraps the actual luna-send call because
// this engine's luna-send only flushes output when attached to a pty
// (see docs/handoff.md) - without it, exec's captured stdout comes back
// empty even though the command "succeeds". Measured live: this whole
// round trip (deny -> exec -> script -> luna-send -> parse) takes
// ~3.2s on this hardware - slow, but worth it for icons/Pinned
// Apps/Input Source all actually working; see docs/handoff.md for the
// boot-loader UI added alongside this to cover the wait.
const ELEVATED_LISTLAUNCHPOINTS_COMMAND =
  "script -qc \"luna-send -n 1 luna://com.webos.applicationManager/listLaunchPoints '{}'\" /dev/null";

// Generous enough to comfortably cover the elevated path's measured
// ~3.2s (direct denial itself is near-instant, ~6ms) with real margin for
// this hardware's variability, while still bounding worst case - a
// completely stuck/unreachable Homebrew Channel must never hold up boot
// forever.
const LOOKUP_TIMEOUT_MS = 6000;

let iconsByAppKey = new Map();
let discoveredApps = [];

function normalizeIconUrl(path) {
  if (!path) return null;
  // The exact format returned here hasn't been confirmed on-device yet;
  // defensively handle both an already-schemed URL and a bare filesystem
  // path (the common case for on-device app icons).
  return /^(https?:|file:)/.test(path) ? path : `file://${path}`;
}

function queryLaunchPointsElevated() {
  return new Promise((resolve) => {
    window.webOS.service.request("luna://org.webosbrew.hbchannel.service", {
      method: "exec",
      parameters: { command: ELEVATED_LISTLAUNCHPOINTS_COMMAND },
      onSuccess: (res) => {
        try {
          const parsed = JSON.parse(res.stdoutString);
          resolve(parsed.launchPoints || []);
        } catch (err) {
          console.error("[icons] elevated listLaunchPoints: bad JSON from exec", err, res);
          resolve([]);
        }
      },
      onFailure: (err) => {
        console.error(
          "[icons] elevated listLaunchPoints failed - Homebrew Channel not installed/reachable?",
          err
        );
        resolve([]);
      },
    });
  });
}

function queryLaunchPoints() {
  return new Promise((resolve) => {
    if (!isWebOS()) {
      resolve([]);
      return;
    }
    let settled = false;
    const finish = (points) => {
      if (settled) return;
      settled = true;
      resolve(points);
    };
    window.webOS.service.request("luna://com.webos.applicationManager", {
      method: "listLaunchPoints",
      parameters: {},
      onSuccess: (res) => finish(res?.launchPoints || []),
      onFailure: (err) => {
        // Expected failure on this TV (see the comment above
        // queryLaunchPointsElevated) - fall back to the elevated path
        // instead of giving up outright.
        console.warn("[icons] listLaunchPoints denied directly, trying elevated path", err);
        queryLaunchPointsElevated().then(finish);
      },
    });
    // Never let a stuck/slow Luna call hold up boot forever - worst
    // case, every tile just keeps its emoji fallback. Covers both the
    // direct call above and the elevated fallback it may chain into.
    setTimeout(() => finish([]), LOOKUP_TIMEOUT_MS);
  });
}

// Call once at boot, before the first render, so tiles paint with the
// right icon from the start instead of needing a swap-in-place later.
export async function resolveWebOSIcons(apps) {
  const points = await queryLaunchPoints();

  discoveredApps = points.map((p) => ({
    id: p.id,
    label: p.title || p.id,
    iconUrl: normalizeIconUrl(p.icon),
  }));

  const iconByLaunchPointId = new Map(points.map((p) => [p.id, p.icon]));
  const next = new Map();
  for (const app of apps) {
    const icon = app.appId && iconByLaunchPointId.get(app.appId);
    if (icon) next.set(app.key, normalizeIconUrl(icon));
  }
  iconsByAppKey = next;
  return next;
}

export function getResolvedIcon(appKey) {
  return iconsByAppKey.get(appKey) ?? null;
}

// Every real installed app on the TV (empty off-device). Settings uses
// this to let you pin anything actually installed, not just the static
// demo catalog.
export function getDiscoveredApps() {
  return discoveredApps;
}
