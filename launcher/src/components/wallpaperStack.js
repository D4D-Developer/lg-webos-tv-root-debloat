import { h } from "../core/dom.js";
import { getAllWallpapers, pickRandom } from "../core/wallpapers.js";

const CROSSFADE_MS = 1400;

function layerFor(wallpaper) {
  const layer = h("div", { class: "wallpaper-layer" });
  if (wallpaper.type === "image") {
    layer.style.backgroundImage = `url("${wallpaper.url}")`;
    layer.style.backgroundSize = "cover";
    layer.style.backgroundPosition = "center";
  } else {
    layer.style.background = wallpaper.css;
  }
  return layer;
}

// A shuffling, cross-fading background. `dimmed` is the OLED-safe mode for
// the Sleep screensaver (very low opacity instead of a legibility scrim);
// without it, this is the full-brightness dashboard background. Wallpapers
// rotate randomly rather than in a fixed order, so layers are created and
// discarded on the fly instead of a pre-built stack like the hero's.
export function createWallpaperStack({
  dimmed = false,
  rotateMs = 12 * 60 * 1000,
  context = "dashboard", // 'dashboard' | 'screensaver' - which category list applies
} = {}) {
  const el = h("div", { class: `wallpaper-stack${dimmed ? " wallpaper-stack--dimmed" : ""}` });
  let current = null;
  let timer = null;

  function show(wallpaper) {
    const layer = layerFor(wallpaper);
    el.appendChild(layer);
    void layer.offsetWidth; // force layout so the opacity transition runs
    layer.classList.add("is-active");
    const prev = current;
    current = layer;
    if (prev) {
      prev.classList.remove("is-active");
      setTimeout(() => prev.remove(), CROSSFADE_MS);
    }
  }

  function next() {
    show(pickRandom(undefined, context));
  }

  function start() {
    if (getAllWallpapers(context).length === 0) return;
    show(pickRandom(undefined, context));
    if (timer) clearInterval(timer);
    if (rotateMs > 0 && getAllWallpapers(context).length > 1) {
      timer = setInterval(next, rotateMs);
    }
  }

  // Halts rotation AND fades the current layer back out (e.g. OLED Sleep
  // reverting to pure black after its protection window) - not just a
  // pause that leaves the last image frozen on screen.
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    if (current) {
      current.classList.remove("is-active");
      const toRemove = current;
      current = null;
      setTimeout(() => toRemove.remove(), CROSSFADE_MS);
    }
  }

  return { el, start, stop, next };
}
