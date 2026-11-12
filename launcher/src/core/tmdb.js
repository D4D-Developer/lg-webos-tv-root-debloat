// Fallback hero content for when Plex isn't configured or has nothing on
// deck: TMDB's free "trending" endpoint. This is generic trending art, not
// personalized to any watch history - it exists purely so the hero still
// shows something real-looking instead of placeholder gradients. Needs a
// free TMDB API key (themoviedb.org), entered in Settings - never
// hardcoded/committed.

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w1280";
const FETCH_TIMEOUT_MS = 4000;

export async function fetchTmdbTrending(apiKey, { limit = 5 } = {}) {
  if (!apiKey) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const url = `${TMDB_BASE}/trending/all/week?api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`TMDB responded ${res.status}`);
    const data = await res.json();
    const items = (data?.results ?? []).filter((item) => item.backdrop_path);

    return items.slice(0, limit).map((item) => ({
      title: item.title || item.name,
      nextUp: null, // trending items aren't episodic - no "next up" to show
      badges: [],
      imageUrl: `${TMDB_IMAGE_BASE}${item.backdrop_path}`,
      progressPct: 0, // no personal watch history behind this source
      source: "tmdb",
    }));
  } finally {
    clearTimeout(timer);
  }
}
