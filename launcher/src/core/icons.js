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

const LOOKUP_TIMEOUT_MS = 2000;

let iconsByAppKey = new Map();
let discoveredApps = [];

function normalizeIconUrl(path) {
  if (!path) return null;
  // The exact format returned here hasn't been confirmed on-device yet;
  // defensively handle both an already-schemed URL and a bare filesystem
  // path (the common case for on-device app icons).
  return /^(https?:|file:)/.test(path) ? path : `file://${path}`;
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
        console.error("[icons] listLaunchPoints failed", err);
        finish([]);
      },
    });
    // Never let a stuck/slow Luna call hold up boot - worst case, every
    // tile just keeps its emoji fallback.
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
