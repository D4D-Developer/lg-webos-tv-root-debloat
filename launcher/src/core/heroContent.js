// Resolves what the Apple TV hero spotlight actually shows: real Plex
// "on deck" items first, TMDB trending as a fallback "just in case" Plex
// isn't configured or has nothing to show, and the built-in demo slides as
// the final fallback (and the default when the feature is off). Mirrors
// core/telemetry.js's shape - instant synchronous content first (here,
// always the demo slides, since there's nothing worth caching across a
// cold boot the way weather is), then an async upgrade.

import { fetchPlexOnDeck } from "./plex.js";
import { fetchTmdbTrending } from "./tmdb.js";
import { HERO_SLIDES as DEMO_SLIDES } from "../data/demoContent.js";

async function resolveRealSlides(settings) {
  if (!settings.useRealHeroContent) return null;

  if (settings.plexServerUrl && settings.plexToken) {
    try {
      const items = await fetchPlexOnDeck(settings.plexServerUrl, settings.plexToken);
      if (items.length > 0) return items;
    } catch (err) {
      console.error("[heroContent] Plex fetch failed, trying TMDB fallback", err);
    }
  }

  if (settings.tmdbApiKey) {
    try {
      const items = await fetchTmdbTrending(settings.tmdbApiKey);
      if (items.length > 0) return items;
    } catch (err) {
      console.error("[heroContent] TMDB fetch failed, falling back to demo content", err);
    }
  }

  return null;
}

export function startHeroContentLoop(getSettings, onUpdate, intervalMs = 5 * 60 * 1000) {
  let cancelled = false;

  // Demo slides paint immediately - there's no network wait on the first
  // frame regardless of what's configured.
  onUpdate(DEMO_SLIDES);

  async function run() {
    const settings = getSettings();
    const real = await resolveRealSlides(settings);
    if (!cancelled) onUpdate(real || DEMO_SLIDES);
  }

  run();
  const timer = setInterval(run, intervalMs);

  return {
    refreshNow: run,
    stop() {
      cancelled = true;
      clearInterval(timer);
    },
  };
}
