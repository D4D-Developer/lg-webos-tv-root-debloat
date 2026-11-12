// The wallpaper pool: built-in generated gradients (zero licensing risk,
// same technique as the hero backdrop atmosphere) plus whatever image files
// are dropped in src/assets/wallpapers/ (see that folder's README), grouped
// into categories by subfolder (e.g. assets/wallpapers/cars/*.jpeg -> the
// "cars" category). Shared by both the dashboard background and the OLED
// Sleep screensaver, each filtered independently by whichever categories
// are enabled for that context in Settings -> Wallpaper & Screensaver -
// some images (e.g. with text baked in) work as a screensaver but not
// behind the dashboard's UI/scrim, or vice versa.

import { getSettings } from "./settings.js";

export const DEFAULT_CATEGORY = "default";

// `**` makes this recursive (subfolders = categories). Resolves to an empty
// object (not an error) if the folder is empty, so this works before any
// custom wallpapers have been added.
const bundled = import.meta.glob("../assets/wallpapers/**/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
});

function categoryFromPath(path) {
  // path looks like "../assets/wallpapers/cars/foo.jpeg" (eager glob keys
  // are the source-relative import specifiers, not the resolved URLs).
  const match = path.match(/wallpapers\/([^/]+)\//);
  return match ? match[1] : DEFAULT_CATEGORY;
}

const customWallpapers = Object.entries(bundled).map(([path, url]) => ({
  type: "image",
  url,
  category: categoryFromPath(path),
}));

export const DEFAULT_WALLPAPERS = [
  { type: "gradient", css: "linear-gradient(160deg, #0f172a 0%, #1e293b 45%, #0b0d12 100%)" },
  { type: "gradient", css: "linear-gradient(160deg, #1c1304 0%, #3b2410 45%, #120d0a 100%)" },
  { type: "gradient", css: "linear-gradient(160deg, #0b0a1c 0%, #1e1b4b 45%, #050505 100%)" },
  { type: "gradient", css: "linear-gradient(160deg, #111827 0%, #0f2027 45%, #000000 100%)" },
  { type: "gradient", css: "linear-gradient(160deg, #1a0b1f 0%, #3b1d3b 45%, #0b0d12 100%)" },
].map((w) => ({ ...w, category: DEFAULT_CATEGORY }));

const ALL_WALLPAPERS = [...DEFAULT_WALLPAPERS, ...customWallpapers];

// Category names in a stable order: "default" first, then whatever
// subfolders exist, alphabetically - not file-discovery order, which would
// otherwise shuffle around as files are added/removed.
export function getCategories() {
  const found = new Set(customWallpapers.map((w) => w.category));
  return [DEFAULT_CATEGORY, ...Array.from(found).sort()];
}

const CONTEXT_SETTINGS_KEY = {
  dashboard: "dashboardWallpaperCategories",
  screensaver: "screensaverWallpaperCategories",
};

// `null` (the default, for either context) means "everything" - avoids
// needing to hardcode/predict the category list in settings.js defaults,
// since it's only known at build time from whatever folders exist. Becomes
// a concrete array the first time a category is toggled off for that
// specific context (dashboard and screensaver are independent).
export function getAllWallpapers(context = "dashboard") {
  const key = CONTEXT_SETTINGS_KEY[context] || CONTEXT_SETTINGS_KEY.dashboard;
  const enabled = getSettings()[key];
  if (enabled) return ALL_WALLPAPERS.filter((w) => enabled.includes(w.category));
  // "everything enabled" (the default, `enabled` is null) excludes the
  // built-in generated gradients from the dashboard specifically, once
  // any real custom wallpapers exist - they're dark enough to read as
  // "no wallpaper at all" against this app's already-dark theme, which
  // is what was being reported as the dashboard background
  // intermittently looking blank (~8% chance per pick: 5 of 63 pool
  // entries were gradients). Still reachable by explicitly re-enabling
  // "Default (generated) -> Dashboard" in Settings (an explicit array
  // that includes DEFAULT_CATEGORY, handled by the branch above), and
  // still the real fallback for a library with zero custom wallpapers -
  // the `customWallpapers.length > 0` check means a fresh install with
  // nothing in src/assets/wallpapers/ yet still gets the gradients, not
  // a blank dashboard. Screensaver's own "everything" default is
  // unchanged - only the dashboard was reported as having this problem.
  if (context === "dashboard" && customWallpapers.length > 0) {
    return ALL_WALLPAPERS.filter((w) => w.category !== DEFAULT_CATEGORY);
  }
  return ALL_WALLPAPERS;
}

export function pickRandom(exclude, context = "dashboard") {
  const pool = getAllWallpapers(context).filter((w) => w !== exclude);
  if (pool.length === 0) return exclude || DEFAULT_WALLPAPERS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}
