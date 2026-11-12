const STORAGE_KEY = "lg-tv-launcher:settings";

// These coordinates are the real ones resolved via the (now-removed)
// geolocation feature in an earlier session - not a placeholder guess.
// "Dadri" is what reverse-geocoding returned for them; "Gr. Noida West" is the
// name actually wanted for display.
const DEFAULT_CITY = { name: "Gr. Noida West", lat: 28.56199467249729, lon: 77.45409739512694 };

export const CITY_PRESETS = [
  DEFAULT_CITY,
  { name: "Delhi, IN", lat: 28.6139, lon: 77.209 },
  { name: "Bengaluru, IN", lat: 12.9716, lon: 77.5946 },
  { name: "Hyderabad, IN", lat: 17.385, lon: 78.4867 },
];

const DEFAULTS = {
  layout: "apple-tv", // 'apple-tv' | 'bento' | 'minimal-dock'
  theme: "obsidian", // 'obsidian' | 'warm-cinema' | 'monochrome' | 'pure-void'
  city: DEFAULT_CITY,
  pinnedApps: [
    "netflix",
    "youtube",
    "primevideo",
    "jiohotstar",
    "appletv",
    "plex",
    "browser",
  ],
  oledPixelShiftAuto: true,
  oledPixelShiftIntervalMs: 45000,
  // On by default - unlike Hero Content, this needs no credentials and has
  // built-in generated wallpapers to show even with zero custom images, so
  // there's nothing to configure before it's a net improvement.
  wallpaperMode: "shuffle", // 'shuffle' | 'off' - controls the dashboard background only
  // Independent per-context category lists: some images (e.g. ones with
  // text baked in, like a motivational quote) read fine full-screen as a
  // screensaver but get covered/illegible behind the dashboard's UI and
  // scrim. null = every category enabled for that context. Only becomes a
  // concrete array once a category is toggled off for that context -
  // avoids hardcoding a category list here that's actually only known at
  // build time (core/wallpapers.js discovers it from whatever subfolders
  // exist in src/assets/wallpapers/).
  dashboardWallpaperCategories: null,
  screensaverWallpaperCategories: null,
  // Off by default: without credentials configured it wouldn't show
  // anything real anyway, and defaulting new installs to the built-in demo
  // content is the non-surprising choice.
  useRealHeroContent: false,
  plexServerUrl: "", // e.g. http://192.168.1.50:32400 - your own LAN server
  plexToken: "", // your own Plex auth token - never hardcode/commit this
  tmdbApiKey: "", // free key from themoviedb.org - never hardcode/commit this
  // Weather effects (rain/fog/snow/storm overlay from the 3-hour forecast),
  // on by default - purely visual, no credentials, no extra network cost
  // (rides along with the existing weather fetch).
  weatherEffectsEnabled: true,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    // Corrupt/blocked storage (private window, cleared mid-session, etc.)
    // falls back to defaults rather than breaking the whole app.
    return { ...DEFAULTS };
  }
}

let state = load();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full/unavailable; settings still work in-memory for
    // the rest of this session, they just won't survive a reload.
  }
}

export function getSettings() {
  return state;
}

export function updateSettings(patch) {
  state = { ...state, ...patch };
  persist();
  listeners.forEach((fn) => fn(state));
}

export function onSettingsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
