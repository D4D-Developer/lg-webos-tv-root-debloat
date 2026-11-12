import "./core/webosBridge.js";
import { h, clear } from "./core/dom.js";
import { getSettings, onSettingsChange } from "./core/settings.js";
import { initNavigation, focusFirst } from "./core/navigation.js";
import { startTelemetryLoop } from "./core/telemetry.js";
import { startHeroContentLoop } from "./core/heroContent.js";
import { startAutoPixelShift, createOledSleep } from "./core/oled.js";
import { resolveWebOSIcons } from "./core/icons.js";
import { APPS, getPinnedApps } from "./data/apps.js";
import { createStatusBar } from "./components/statusbar.js";
import { createWallpaperStack } from "./components/wallpaperStack.js";
import { createWeatherEffects } from "./components/weatherEffects.js";
import { appleTvLayout } from "./components/appleTvLayout.js";
import { bentoLayout } from "./components/bentoLayout.js";
import { minimalDockLayout } from "./components/minimalDockLayout.js";
import { createSettingsDrawer } from "./components/settingsDrawer.js";

const LAYOUT_FACTORIES = {
  "apple-tv": appleTvLayout,
  bento: bentoLayout,
  "minimal-dock": minimalDockLayout,
};

const root = document.getElementById("app");
let currentLayout = null;
let lastTelemetry = null;
let lastHeroSlides = null;
let stopAutoShift = null;
let sleepActive = false;

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

const layoutContainer = h("div", {});

function mountLayout(layoutName) {
  const factory = LAYOUT_FACTORIES[layoutName] || LAYOUT_FACTORIES["apple-tv"];
  currentLayout = factory(getPinnedApps(getSettings().pinnedApps));
  clear(layoutContainer);
  layoutContainer.appendChild(currentLayout.el);
  if (lastTelemetry) currentLayout.updateTelemetry(lastTelemetry);
  if (lastHeroSlides) currentLayout.updateHeroSlides?.(lastHeroSlides);
  focusFirst(layoutContainer);
}

function applyOledAutoShift(settings) {
  if (stopAutoShift) {
    stopAutoShift();
    stopAutoShift = null;
  }
  if (settings.oledPixelShiftAuto) {
    stopAutoShift = startAutoPixelShift(settings.oledPixelShiftIntervalMs);
  }
}

const dashboardWallpaper = createWallpaperStack({
  dimmed: false,
  rotateMs: 12 * 60 * 1000,
  context: "dashboard",
});

function applyWallpaperMode(settings) {
  if (settings.wallpaperMode === "shuffle") {
    dashboardWallpaper.start();
  } else {
    dashboardWallpaper.stop();
  }
}

const weatherEffects = createWeatherEffects();
let lastUpcomingWeather = "clear";

function applyWeatherEffects(settings) {
  weatherEffects.setCondition(settings.weatherEffectsEnabled ? lastUpcomingWeather : "clear");
}

const oledSleepEl = h("div", { class: "oled-sleep" }, [
  h("div", { class: "oled-sleep__info" }, [
    h("div", { class: "oled-sleep__clock" }, ""),
    h("div", { class: "oled-sleep__date" }, ""),
    h("div", { class: "oled-sleep__weather" }, ""),
  ]),
]);
const oledSleep = createOledSleep(oledSleepEl);

function enterSleep() {
  sleepActive = true;
  oledSleep.enter();
}

function exitSleep() {
  sleepActive = false;
  oledSleep.exit();
}

const statusBar = createStatusBar({
  onOledSleep: enterSleep,
  onOpenSettings: () => settingsDrawer.open(),
  // Optional chaining: `telemetry` isn't assigned until boot()'s icon
  // lookup resolves, so this guards the (brief, rare) window where the UI
  // is already interactive but that hasn't finished yet.
  onRefreshTelemetry: () => telemetry?.refreshNow(),
});

const settingsDrawer = createSettingsDrawer({
  onChange: (settings) => {
    applyTheme(settings.theme);
    mountLayout(settings.layout);
    applyOledAutoShift(settings);
    applyWallpaperMode(settings);
    applyWeatherEffects(settings);
    // So changing the city (or toggling real hero content / editing
    // Plex/TMDB fields) applies right away instead of waiting for the next
    // scheduled refresh - this was the actual cause of needing a manual
    // page reload to see a new city's weather take effect.
    telemetry?.refreshNow();
    heroContent?.refreshNow();
  },
});

root.appendChild(dashboardWallpaper.el);
root.appendChild(statusBar.el);
root.appendChild(layoutContainer);
root.appendChild(weatherEffects.el);
root.appendChild(settingsDrawer.el);
root.appendChild(oledSleepEl);

// Exit OLED Sleep on any input, intercepted ahead of spatial navigation
// (registered first + stopImmediatePropagation so the "waking" key press
// doesn't also move focus or activate whatever's underneath).
window.addEventListener(
  "keydown",
  (e) => {
    if (sleepActive) {
      exitSleep();
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },
  true
);
window.addEventListener(
  "pointerdown",
  () => {
    if (sleepActive) exitSleep();
  },
  true
);

window.addEventListener("tv:toggle-settings", () => {
  if (settingsDrawer.isOpen()) {
    settingsDrawer.close();
  } else {
    settingsDrawer.open();
  }
});

window.addEventListener("tv:back", () => {
  if (settingsDrawer.isOpen()) settingsDrawer.close();
});

let telemetry = null;
let heroContent = null;

async function boot() {
  const settings = getSettings();
  applyTheme(settings.theme);

  // Resolved before the first mountLayout() so tiles paint with the real
  // icon from the start rather than needing a swap-in-place after.
  // Resolves instantly (empty) off-device and on a TV where the direct
  // Luna call succeeds; on this TV specifically it goes through
  // icons.js's slower elevated fallback (~3.2s, measured - see that
  // file's comments), which is why the boot loader below exists. Always
  // bounded by icons.js's own timeout either way, so a stuck Luna call
  // can never hold up boot forever.
  await resolveWebOSIcons(Object.values(APPS));

  mountLayout(settings.layout);
  applyOledAutoShift(settings);
  applyWallpaperMode(settings);
  applyWeatherEffects(settings);

  // Dashboard is actually painted now - fade the boot loader out and drop
  // it from the DOM once the transition finishes (matches the 400ms
  // transition duration in base.css).
  const bootLoader = document.getElementById("boot-loader");
  if (bootLoader) {
    bootLoader.classList.add("is-done");
    setTimeout(() => bootLoader.remove(), 400);
  }

  onSettingsChange(() => {
    // Settings can also change from outside the drawer's own render loop in
    // the future (e.g. a remote-control API); keep layout/theme in sync.
    const s = getSettings();
    applyTheme(s.theme);
  });

  telemetry = startTelemetryLoop(
    () => getSettings().city,
    (data) => {
      lastTelemetry = data;
      statusBar.updateTelemetry(data);
      oledSleep.updateTelemetry(data);
      if (currentLayout) currentLayout.updateTelemetry(data);
      lastUpcomingWeather = data.upcomingWeather || "clear";
      applyWeatherEffects(getSettings());
    }
  );

  heroContent = startHeroContentLoop(getSettings, (slides) => {
    lastHeroSlides = slides;
    currentLayout?.updateHeroSlides?.(slides);
  });

  initNavigation();
  focusFirst(layoutContainer);
}

boot();
