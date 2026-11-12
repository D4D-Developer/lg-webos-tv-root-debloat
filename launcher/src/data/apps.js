import { getResolvedIcon, getDiscoveredApps } from "../core/icons.js";

// This catalog is now only the off-device (local dev) fallback. On a real
// TV, getPinnableApps() below uses the live discovered-apps list instead
// (core/icons.js), so `appId: null` here no longer needs hand-filling via
// SSH to make launching/pinning work on-device - it already does, because
// discovered apps carry their own real, verified id. This catalog still
// matters for local browser testing, where there's nothing to discover.
// `websiteUrl` is only used by the local dev-mode launch fallback.

export const APPS = {
  netflix: {
    key: "netflix",
    label: "Netflix",
    icon: "🎬",
    glyph: "film",
    color: "#e50914",
    appId: null,
    websiteUrl: "https://www.netflix.com",
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    icon: "▶️",
    glyph: "play",
    color: "#ff0000",
    appId: null,
    websiteUrl: "https://www.youtube.com",
  },
  primevideo: {
    key: "primevideo",
    label: "Prime Video",
    icon: "🎞️",
    glyph: "tv",
    color: "#00a8e1",
    appId: null,
    websiteUrl: "https://www.primevideo.com",
  },
  jiohotstar: {
    key: "jiohotstar",
    label: "JioHotstar",
    icon: "⭐",
    glyph: "star",
    color: "#1f3f8f",
    appId: null,
    websiteUrl: "https://www.hotstar.com",
  },
  appletv: {
    key: "appletv",
    label: "Apple TV+",
    icon: "🍎",
    glyph: "playCircle",
    // Apple TV+'s real brand mark is black/white - #222222 worked fine as
    // an emoji tint (emoji carry their own color) but is nearly invisible
    // now that it's the actual SVG stroke color against a dark tile.
    color: "#e8e8ed",
    appId: null,
    websiteUrl: "https://tv.apple.com",
  },
  spotify: {
    key: "spotify",
    label: "Spotify",
    icon: "🎵",
    glyph: "music",
    color: "#1db954",
    appId: null,
    websiteUrl: "https://open.spotify.com",
  },
  plex: {
    key: "plex",
    label: "Plex",
    icon: "📺",
    glyph: "layers",
    color: "#e5a00d",
    appId: null,
    websiteUrl: "https://app.plex.tv",
  },
  browser: {
    key: "browser",
    label: "Web Browser",
    icon: "🌐",
    glyph: "globe",
    color: "#38bdf8",
    // The system browser is one webOS app ID that's well-documented
    // across the community: com.webos.app.browser. Still unverified
    // against this specific unit/firmware - confirm before relying on it.
    appId: "com.webos.app.browser",
    websiteUrl: "https://www.google.com",
  },
};

// Generic look for a discovered app - there's no hand-authored glyph/brand
// color for an arbitrary real installed app the way there is for the demo
// catalog, and it always has a real icon image anyway (from the same
// listLaunchPoints call), so the glyph only ever shows if that image
// fails to load.
const DISCOVERED_APP_GLYPH = "tv";
const DISCOVERED_APP_COLOR = "#9ca3af";

// Whatever can currently be pinned to the home screen: the TV's real
// installed apps if we're on-device and they resolved, otherwise the
// static demo catalog (local dev / nothing discovered yet). Settings'
// "Pinned Apps" list and getPinnedApps() below both read from this, so
// neither needs to know which source is actually active.
export function getPinnableApps() {
  const discovered = getDiscoveredApps();
  if (discovered.length > 0) {
    return discovered.map((app) => ({
      key: app.id,
      label: app.label,
      iconUrl: app.iconUrl,
      glyph: DISCOVERED_APP_GLYPH,
      color: DISCOVERED_APP_COLOR,
      appId: app.id,
      websiteUrl: null,
    }));
  }
  return Object.values(APPS).map((app) => ({ ...app, iconUrl: getResolvedIcon(app.key) }));
}

export function getPinnedApps(pinnedKeys) {
  const all = getPinnableApps();
  const byKey = new Map(all.map((app) => [app.key, app]));
  const resolved = pinnedKeys.map((key) => byKey.get(key)).filter(Boolean);
  if (resolved.length > 0) return resolved;
  // Stored pinned keys don't match anything pinnable right now - e.g. the
  // first boot on a real TV, where discovered app ids don't match the
  // static dev-catalog keys the default settings were written with.
  // Showing the first few real apps beats an empty home screen; re-pin
  // whichever ones you actually want via Settings.
  return all.slice(0, 8);
}
