import { getResolvedIcon, getDiscoveredApps } from "../core/icons.js";

// getPinnableApps() below prefers the TV's live discovered-apps list
// (core/icons.js) when available, falling back to this static catalog
// otherwise. In practice, on this TV/firmware, live discovery never
// succeeds from the app's own JS context - listLaunchPoints is
// permission-denied there (see docs/handoff.md's "Known limitation") -
// so this catalog, and its hand-filled `appId`s, is what Pinned Apps
// actually runs on. Real ids come from `luna-send listLaunchPoints` run
// directly over root SSH (full privileged access, unlike the app's own
// restricted identity) - re-run that lookup and update this file if apps
// are installed/removed on the TV. `websiteUrl` is only used by the local
// dev-mode (off-device browser) launch fallback.

export const APPS = {
  netflix: {
    key: "netflix",
    label: "Netflix",
    icon: "🎬",
    glyph: "film",
    color: "#e50914",
    // Real ids below came from `luna-send listLaunchPoints` run directly
    // over root SSH (full privileged access) - see docs/handoff.md's
    // "Known limitation": the app's own JS can't call this live
    // (permission-denied for a sideloaded app's own identity), so these
    // have to be hand-filled rather than discovered at runtime.
    appId: "netflix",
    websiteUrl: "https://www.netflix.com",
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    icon: "▶️",
    glyph: "play",
    color: "#ff0000",
    appId: "youtube.leanback.v4",
    websiteUrl: "https://www.youtube.com",
  },
  primevideo: {
    key: "primevideo",
    label: "Prime Video",
    icon: "🎞️",
    glyph: "tv",
    color: "#00a8e1",
    // Real installed id is just "amazon", not anything Prime-branded -
    // confirmed via listLaunchPoints' "title": "Prime Video" on this id.
    appId: "amazon",
    websiteUrl: "https://www.primevideo.com",
  },
  jiohotstar: {
    key: "jiohotstar",
    label: "JioHotstar",
    icon: "⭐",
    glyph: "star",
    color: "#1f3f8f",
    appId: "hotstar",
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
    appId: "com.apple.appletv",
    websiteUrl: "https://tv.apple.com",
  },
  plex: {
    key: "plex",
    label: "Plex",
    icon: "📺",
    glyph: "layers",
    color: "#e5a00d",
    // Same as Spotify - not installed on this TV, left null rather than
    // guessed.
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
  // Everything below was found installed on this TV via the same SSH
  // listLaunchPoints lookup (not guessed) and added so it's available to
  // pin from Settings - none of these are auto-pinned to the home screen
  // by default (see settings.js's DEFAULTS.pinnedApps), to keep the
  // curated starter dashboard from getting cluttered with apps not
  // everyone wants there (Developer Mode, Homebrew Channel, Pac-Man,
  // etc.) - pin whichever of these you actually want via Settings.
  zee5: {
    key: "zee5",
    label: "ZEE5",
    icon: "📺",
    glyph: "tv",
    color: "#8b2fc9",
    appId: "com.zee5.app",
    websiteUrl: "https://www.zee5.com",
  },
  sonyliv: {
    key: "sonyliv",
    label: "SonyLIV",
    icon: "▶️",
    glyph: "play",
    color: "#14b8a6",
    appId: "com.sonyliv2.tvapp",
    websiteUrl: "https://www.sonyliv.com",
  },
  jiocinema: {
    key: "jiocinema",
    label: "JioCinema",
    icon: "🎬",
    glyph: "film",
    color: "#f0541f",
    // Real listLaunchPoints title is "JioCinema-Shows, Movies & More" -
    // shortened here to fit a tile label; the app id is unaffected.
    appId: "com.viacom18.media.ondemand",
    websiteUrl: "https://www.jiocinema.com",
  },
  voot: {
    key: "voot",
    label: "Voot",
    icon: "📺",
    glyph: "tv",
    color: "#7c3aed",
    appId: "com.viacom18.voot",
    websiteUrl: "https://www.voot.com",
  },
  alexa: {
    key: "alexa",
    label: "Amazon Alexa",
    icon: "🎙️",
    glyph: "mic",
    color: "#22d3ee",
    appId: "amazon.alexa",
    websiteUrl: null,
  },
  contentstore: {
    key: "contentstore",
    label: "LG Content Store",
    icon: "🏪",
    glyph: "grid",
    color: "#6366f1",
    appId: "com.webos.app.discovery",
    websiteUrl: null,
  },
  photovideo: {
    key: "photovideo",
    label: "Photo & Video",
    icon: "🖼️",
    glyph: "image",
    color: "#10b981",
    appId: "com.webos.app.photovideo",
    websiteUrl: null,
  },
  tvmusic: {
    key: "tvmusic",
    label: "Music",
    icon: "🎵",
    glyph: "music",
    color: "#22c55e",
    // webOS's own built-in Music app - distinct key from the Spotify
    // entry that used to live here (removed - not installed on this TV).
    appId: "com.webos.app.music",
    websiteUrl: null,
  },
  homedashboard: {
    key: "homedashboard",
    label: "Home Dashboard",
    icon: "🏠",
    glyph: "home",
    color: "#f59e0b",
    appId: "com.webos.app.homeconnect",
    websiteUrl: null,
  },
  pacman: {
    key: "pacman",
    label: "Pac-Man",
    icon: "🕹️",
    glyph: "gamepad",
    color: "#eab308",
    appId: "com.playworks.app.pacman",
    websiteUrl: null,
  },
  hbchannel: {
    key: "hbchannel",
    label: "Homebrew Channel",
    icon: "🛠️",
    glyph: "terminal",
    color: "#94a3b8",
    appId: "org.webosbrew.hbchannel",
    websiteUrl: null,
  },
  devmode: {
    key: "devmode",
    label: "Developer Mode",
    icon: "🛠️",
    glyph: "terminal",
    color: "#64748b",
    appId: "com.palmdts.devmode",
    websiteUrl: null,
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

// Bridges a discovered app's real webOS id back to whichever static
// catalog key (if any) used to represent it before live discovery
// worked - see getPinnedApps' own comment for the read side of why this
// matters; settingsDrawer.js's pinned-apps toggle needs the same bridge
// on the write side, or turning a pin "off" there would filter out the
// real id while the actually-stored old key silently stays pinned.
export function getStaticKeyForAppId(appId) {
  const entry = Object.values(APPS).find((app) => app.appId === appId);
  return entry?.key;
}

export function getPinnedApps(pinnedKeys) {
  const all = getPinnableApps();
  const byKey = new Map(all.map((app) => [app.key, app]));
  // A stored pinned key is one of this catalog's own arbitrary keys
  // (e.g. "youtube"), but once live discovery actually succeeds, `all`
  // is keyed by each app's REAL webOS id instead (e.g.
  // "youtube.leanback.v4") - those don't match by equality for most
  // entries (only "netflix"/"browser" happen to coincide), which would
  // otherwise make most previously-pinned apps silently vanish the
  // moment discovery starts working, not just on a first/empty-pins
  // boot. The static catalog already knows each of its own keys' real
  // appId (filled in via the SSH listLaunchPoints lookup - see that
  // field's own comments), so check that too before giving up on a key.
  const resolved = pinnedKeys
    .map((key) => byKey.get(key) || byKey.get(APPS[key]?.appId))
    .filter(Boolean);
  if (resolved.length > 0) return resolved;
  // Stored pinned keys don't match anything pinnable right now - e.g. the
  // first boot on a real TV, where discovered app ids don't match the
  // static dev-catalog keys the default settings were written with.
  // Showing the first few real apps beats an empty home screen; re-pin
  // whichever ones you actually want via Settings.
  return all.slice(0, 8);
}
