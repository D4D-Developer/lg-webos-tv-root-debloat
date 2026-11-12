import { h } from "../core/dom.js";
import { appTile } from "./appTile.js";

export function minimalDockLayout(pinnedApps) {
  const clockEl = h("div", { class: "minimal-dock__clock" }, "--:--");
  const weatherEl = h("div", { class: "minimal-dock__weather" }, "—");

  function tick() {
    const now = new Date();
    clockEl.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
  }
  tick();
  setInterval(tick, 1000 * 15);

  const dock = h(
    "div",
    { class: "minimal-dock__dock glass-panel" },
    pinnedApps.map((app) => appTile(app))
  );

  // Wrapping the clock/weather in its own flex:1 container lets it center
  // in the space ABOVE the dock, while the dock itself is a normal last
  // flex item - naturally pinned to the bottom instead of centered as a
  // group with everything else.
  const content = h("div", { class: "minimal-dock__content" }, [
    h("div", { class: "minimal-dock__sanctuary" }, [clockEl, weatherEl]),
  ]);

  const el = h("div", { class: "layout-root", "data-layout": "minimal-dock" }, [content, dock]);

  function updateTelemetry(data) {
    weatherEl.textContent =
      data.tempC != null ? `${data.weatherIcon} ${data.tempC}° · ${data.city}` : `❔ ${data.city}`;
  }

  return { el, updateTelemetry };
}
