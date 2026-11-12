import { h } from "../core/dom.js";

const RAIN_DROP_COUNT = 24;
const SNOW_FLAKE_COUNT = 18;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function rainLayer() {
  const drops = [];
  for (let i = 0; i < RAIN_DROP_COUNT; i++) {
    const drop = h("div", { class: "weather-fx__drop" });
    drop.style.left = `${randomBetween(0, 100)}%`;
    drop.style.animationDuration = `${randomBetween(0.6, 1.1).toFixed(2)}s`;
    drop.style.animationDelay = `-${randomBetween(0, 1.1).toFixed(2)}s`;
    drops.push(drop);
  }
  return h("div", { class: "weather-fx__rain" }, drops);
}

function snowLayer() {
  const flakes = [];
  for (let i = 0; i < SNOW_FLAKE_COUNT; i++) {
    const flake = h("div", { class: "weather-fx__flake" });
    flake.style.left = `${randomBetween(0, 100)}%`;
    flake.style.width = flake.style.height = `${randomBetween(3, 6).toFixed(1)}px`;
    flake.style.animationDuration = `${randomBetween(5, 9).toFixed(2)}s`;
    flake.style.animationDelay = `-${randomBetween(0, 9).toFixed(2)}s`;
    flakes.push(flake);
  }
  return h("div", { class: "weather-fx__snow" }, flakes);
}

// A subtle, GPU-cheap overlay reacting to the next-3-hours forecast
// (core/telemetry.js's `upcomingWeather`) - only `transform`/`opacity`
// animate, consistent with every other animation in this app, to stay
// light on the TV's weak GPU. Sits above the dashboard content (so rain
// reads as "in front of the scene") but is fully `pointer-events: none`
// and low-opacity, so it never blocks interaction or legibility, and its
// z-index keeps it below the Settings drawer/OLED Sleep so it doesn't
// bleed into those.
export function createWeatherEffects() {
  const el = h("div", { class: "weather-fx" }, [
    h("div", { class: "weather-fx__fog" }),
    rainLayer(),
    snowLayer(),
    h("div", { class: "weather-fx__lightning" }),
  ]);

  function setCondition(condition) {
    el.dataset.condition = condition || "clear";
  }

  return { el, setCondition };
}
