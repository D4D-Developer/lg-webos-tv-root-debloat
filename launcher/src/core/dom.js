// Minimal element-creation helper - no virtual DOM. Direct DOM writes are
// the lightest-weight option for a weak embedded TV GPU/CPU, and this app
// is small enough not to need diffing machinery.

export function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "style") Object.assign(el.style, value);
    else if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "dataset") {
      Object.assign(el.dataset, value);
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined || child === false) continue;
    el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return el;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// `Element.prototype.replaceWith` (the obvious one-liner here) is a
// ChildNode-mixin method that landed in Chrome 54 - one version AFTER
// this TV's real engine (confirmed live: `document.createElement("img")
// .replaceWith` is undefined there, while the older `.remove()` exists
// fine). Broken-icon-image fallback swaps using `.replaceWith()` were
// silently throwing on-device and never actually swapping anything,
// leaving the broken `<img>` (and its alt text, duplicating the tile's
// own label) on screen instead of the intended glyph fallback -
// confirmed live via DevTools, not assumed. `parentNode.replaceChild`
// is universally supported (core DOM Level 1) and does the same thing.
export function replaceEl(oldEl, newEl) {
  oldEl.parentNode?.replaceChild(newEl, oldEl);
}
