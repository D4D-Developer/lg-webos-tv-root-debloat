import { h } from "../core/dom.js";
import { launchApp } from "../core/platform.js";
import { glyphIcon } from "./iconGlyph.js";

function glyphFallback(app) {
  return glyphIcon(app.glyph, { class: "app-tile__icon-glyph" });
}

function tileIcon(app) {
  // data/apps.js's getPinnableApps() already resolves `iconUrl` (whichever
  // source it came from - real webOS icon or discovered-app icon), so this
  // is just a presence check, not a lookup.
  if (!app.iconUrl) return glyphFallback(app);
  // Falls back to the glyph if the resolved path doesn't actually load on
  // this firmware - never leaves a broken-image icon on screen.
  return h("img", {
    class: "app-tile__icon-img",
    src: app.iconUrl,
    alt: app.label,
    onerror: (e) => e.target.replaceWith(glyphFallback(app)),
  });
}

export function appTile(app, { showLabel = true } = {}) {
  return h(
    "button",
    {
      class: "app-tile glass-panel",
      "data-focusable": "true",
      style: { color: app.color },
      onclick: () => launchApp(app),
    },
    [
      tileIcon(app),
      showLabel ? h("span", { class: "app-tile__label" }, app.label) : null,
    ]
  );
}

export function appRow(apps) {
  return h(
    "div",
    // data-wrap: Left/Right at either end of this row wraps around
    // (navigation.js) instead of stopping dead.
    { class: "app-row", "data-wrap": "true" },
    apps.map((app) => appTile(app))
  );
}
