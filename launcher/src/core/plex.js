// Real "Continue Watching" content from a local Plex Media Server, for the
// Apple TV hero spotlight. Plex's local HTTP API (typically
// http://<server-ip>:32400) needs no cloud account/proxy - plain HTTP to a
// LAN server, authenticated with a token the user generates themselves and
// pastes into Settings (never hardcoded, never committed - same "no
// secrets" rule as the rest of this repo).
//
// Field shapes below match Plex's commonly-documented on-deck response;
// unverified against a real server yet - re-check once there's one on hand.

const FETCH_TIMEOUT_MS = 4000;

function abortAfter(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

export function plexImageUrl(serverUrl, token, relativePath) {
  if (!serverUrl || !token || !relativePath) return null;
  return `${serverUrl.replace(/\/$/, "")}${relativePath}?X-Plex-Token=${encodeURIComponent(token)}`;
}

export async function fetchPlexOnDeck(serverUrl, token, { limit = 5 } = {}) {
  if (!serverUrl || !token) return [];

  const { signal, clear } = abortAfter(FETCH_TIMEOUT_MS);
  try {
    const url = `${serverUrl.replace(/\/$/, "")}/library/onDeck?X-Plex-Token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal });
    if (!res.ok) throw new Error(`Plex responded ${res.status}`);
    const data = await res.json();
    const items = data?.MediaContainer?.Metadata ?? [];

    return items.slice(0, limit).map((item) => {
      const isEpisode = !!item.grandparentTitle;
      const progressPct =
        item.viewOffset && item.duration ? Math.round((item.viewOffset / item.duration) * 100) : 0;
      return {
        title: isEpisode ? item.grandparentTitle : item.title,
        nextUp: isEpisode ? `S${item.parentIndex} E${item.index} · ${item.title}` : null,
        badges: [],
        imageUrl: plexImageUrl(serverUrl, token, item.art || item.thumb),
        progressPct,
        source: "plex",
      };
    });
  } finally {
    clear();
  }
}
