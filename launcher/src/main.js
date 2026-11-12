import { h, clear } from "./core/dom.js";
import { getSettings, onSettingsChange } from "./core/settings.js";
import { initNavigation, focusFirst } from "./core/navigation.js";
import { startTelemetryLoop } from "./core/telemetry.js";
import { startHeroContentLoop } from "./core/heroContent.js";
import { startAutoPixelShift, createOledSleep } from "./core/oled.js";
import { resolveWebOSIcons } from "./core/icons.js";
import { APPS, getPinnedApps } from "./data/apps.js";
import { createStatusBar } from "./components/statusbar.js";
import { createInputSwitcher } from "./components/inputSwitcher.js";
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

// Header dropdown, not a Settings entry - closes Settings first if it's
// open, since both share navigation.js's single focus-scope and only one
// should own it at a time. (References settingsDrawer before it's defined
// below - fine, same forward-reference-via-closure pattern already used
// for onOledSleep/onRefreshTelemetry: this only runs once the user clicks,
// long after the whole module has finished evaluating.)
const inputSwitcher = createInputSwitcher({
  onBeforeOpen: () => settingsDrawer.close(),
});

const statusBar = createStatusBar({
  onOledSleep: enterSleep,
  onOpenSettings: () => {
    inputSwitcher.close();
    settingsDrawer.open();
  },
  // Optional chaining: `telemetry` isn't assigned until boot()'s icon
  // lookup resolves, so this guards the (brief, rare) window where the UI
  // is already interactive but that hasn't finished yet.
  onRefreshTelemetry: () => telemetry?.refreshNow(),
  inputSwitcherEl: inputSwitcher.el,
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
    inputSwitcher.close();
    settingsDrawer.open();
  }
});

window.addEventListener("tv:back", () => {
  if (inputSwitcher.isOpen()) inputSwitcher.close();
  else if (settingsDrawer.isOpen()) settingsDrawer.close();
});

let telemetry = null;
let heroContent = null;

async function boot() {
  const settings = getSettings();
  applyTheme(settings.theme);

  // Resolved before the first mountLayout() so tiles paint with the real
  // icon from the start rather than needing a swap-in-place after. Resolves
  // instantly (empty) off-device, and is bounded by icons.js's own timeout
  // so a stuck Luna call can never hold up boot.
  await resolveWebOSIcons(Object.values(APPS));

  mountLayout(settings.layout);
  applyOledAutoShift(settings);
  applyWallpaperMode(settings);
  applyWeatherEffects(settings);

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
