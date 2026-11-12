import { h } from "../core/dom.js";
import { glyphIcon } from "./iconGlyph.js";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function formatClock(date) {
  let hours = date.getHours() % 12;
  if (hours === 0) hours = 12;
  const mm = String(date.getMinutes()).padStart(2, "0");
  const period = date.getHours() < 12 ? "AM" : "PM";
  return `${hours}:${mm} ${period}`;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function createStatusBar({ onOledSleep, onOpenSettings, onRefreshTelemetry, inputSwitcherEl }) {
  const greetingEl = h("span", { class: "statusbar__greeting" }, greeting());
  // User-facing label is just "Sleep" - a glanceable status-bar button is
  // the wrong place for the "OLED" qualifier (unlike "OLED Pixel-Shift" in
  // Settings, where there's room and reason to be precise about what it
  // protects). The feature itself, its code, and its docs keep the OLED
  // naming throughout - only this one label is shortened.
  const oledSleepBtn = h(
    "button",
    { class: "pill pill--button glass-panel", "data-focusable": "true", onclick: onOledSleep },
    [glyphIcon("moon", { class: "pill__icon" }), h("span", {}, "Sleep")]
  );

  const telemetrySegments = {
    weather: h("span", { class: "telemetry-pill__segment" }, "—"),
    aqi: h("span", { class: "telemetry-pill__segment" }, "AQI —"),
    latency: h("span", { class: "telemetry-pill__segment" }, "— ms"),
    mem: h("span", { class: "telemetry-pill__segment" }, "— MB"),
  };

  const divider = () => h("span", { class: "telemetry-pill__divider" });

  const telemetryPill = h(
    "button",
    {
      class: "pill telemetry-pill glass-panel",
      "data-focusable": "true",
      title: "Press Enter to refresh",
      onclick: () => {
        telemetryPill.classList.add("is-refreshing");
        Promise.resolve(onRefreshTelemetry()).finally(() =>
          telemetryPill.classList.remove("is-refreshing")
        );
      },
    },
    [
      telemetrySegments.weather,
      divider(),
      telemetrySegments.aqi,
      divider(),
      telemetrySegments.latency,
      divider(),
      telemetrySegments.mem,
    ]
  );

  const clockTime = h("span", { class: "clock-pill__time" }, "--:--");
  const clockDate = h("span", { class: "clock-pill__date" }, "");
  const clockPill = h("div", { class: "pill clock-pill glass-panel" }, [clockTime, clockDate]);

  const settingsBtn = h(
    "button",
    { class: "icon-btn glass-panel", "data-focusable": "true", onclick: onOpenSettings, title: "Settings (S)" },
    glyphIcon("settings", { class: "icon-btn__glyph" })
  );

  const el = h("div", { class: "statusbar" }, [
    h("div", { class: "statusbar__left" }, [greetingEl, inputSwitcherEl, clockPill]),
    h("div", { class: "statusbar__right" }, [telemetryPill, oledSleepBtn, settingsBtn]),
  ]);

  function tickClock() {
    const now = new Date();
    clockTime.textContent = formatClock(now);
    clockDate.textContent = formatDate(now);
  }
  tickClock();
  setInterval(tickClock, 1000 * 15);

  function updateTelemetry(data) {
    telemetrySegments.weather.textContent = data.tempC != null
      ? `${data.weatherIcon} ${data.tempC}° ${data.city}`
      : `❔ ${data.city}`;
    telemetrySegments.aqi.textContent = data.usAqi != null ? `AQI ${data.usAqi}` : "AQI —";
    telemetrySegments.latency.textContent = data.latencyMs != null ? `${data.latencyMs} ms` : "— ms";
    telemetrySegments.mem.textContent = data.memMB != null ? `${data.memMB} MB` : "MEM N/A";
    // A cached cold-boot reading (data.stale) shows instantly but is dimmed
    // slightly until the real network fetch lands and overwrites it.
    telemetryPill.classList.toggle("is-stale", !!data.stale);
  }

  return { el, updateTelemetry };
}
