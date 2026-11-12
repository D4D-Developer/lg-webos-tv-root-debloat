import { h } from "../core/dom.js";
import { GLYPHS } from "../data/iconGlyphs.js";

export function glyphIcon(name, { class: extraClass = "" } = {}) {
  const el = h("span", { class: `icon-glyph ${extraClass}`.trim() });
  el.innerHTML = GLYPHS[name] || GLYPHS.tv;
  return el;
}
