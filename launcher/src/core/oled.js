// OLED care: a small periodic pixel-shift of the whole UI (static tiles/
// status bar are exactly the kind of content that burns in on OLED), plus
// a full-screen ambient "OLED Sleep" clock mode for when the TV is just
// sitting on the home screen.

import { createWallpaperStack } from "../components/wallpaperStack.js";

const SCREENSAVER_WALLPAPER_ROTATE_MS = 10 * 1000;
// OLED Sleep's whole point is minimizing lit pixels during long idle
// stretches - wallpapers stay heavily dimmed (see wallpaper.css) for this
// long, then the screen reverts to pure black for true burn-in protection
// rather than shuffling dim images indefinitely.
const REVERT_TO_BLACK_AFTER_MS = 12 * 60 * 1000;

const SHIFT_OFFSETS = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 3 },
  { x: 0, y: 3 },
  { x: -3, y: 3 },
  { x: -3, y: 0 },
  { x: -3, y: -3 },
  { x: 0, y: -3 },
  { x: 3, y: -3 },
];

let shiftIndex = 0;

export function shiftPixelsOnce() {
  shiftIndex = (shiftIndex + 1) % SHIFT_OFFSETS.length;
  const { x, y } = SHIFT_OFFSETS[shiftIndex];
  const root = document.documentElement;
  root.style.setProperty("--pixel-shift-x", `${x}px`);
  root.style.setProperty("--pixel-shift-y", `${y}px`);
}

export function startAutoPixelShift(intervalMs) {
  const timer = setInterval(shiftPixelsOnce, intervalMs);
  return () => clearInterval(timer);
}

export function createOledSleep(el) {
  const infoEl = el.querySelector(".oled-sleep__info");
  const clockEl = el.querySelector(".oled-sleep__clock");
  const dateEl = el.querySelector(".oled-sleep__date");
  const weatherEl = el.querySelector(".oled-sleep__weather");
  const wallpaper = createWallpaperStack({
    dimmed: true,
    rotateMs: SCREENSAVER_WALLPAPER_ROTATE_MS,
    context: "screensaver",
  });
  el.insertBefore(wallpaper.el, el.firstChild); // behind the clock
  let driftTimer = null;
  let clockTimer = null;
  let revertTimer = null;

  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function driftClock() {
    const x = Math.round((Math.random() - 0.5) * 80);
    const y = Math.round((Math.random() - 0.5) * 40);
    infoEl.style.transform = `translate(${x}px, ${y}px)`;
  }

  // Fed by the same telemetry loop that updates the status bar - called
  // regardless of whether Sleep is currently active, so the text is already
  // correct the instant Sleep starts rather than waiting on the next tick.
  function updateTelemetry(data) {
    weatherEl.textContent =
      data.tempC != null ? `${data.weatherIcon} ${data.tempC}° ${data.city}` : `❓ ${data.city}`;
  }

  return {
    enter() {
      el.classList.add("is-active");
      tick();
      driftClock();
      clockTimer = setInterval(tick, 1000);
      driftTimer = setInterval(driftClock, 8000);
      wallpaper.start();
      revertTimer = setTimeout(() => wallpaper.stop(), REVERT_TO_BLACK_AFTER_MS);
    },
    exit() {
      el.classList.remove("is-active");
      clearInterval(clockTimer);
      clearInterval(driftTimer);
      clearTimeout(revertTimer);
      wallpaper.stop();
    },
    updateTelemetry,
  };
}
