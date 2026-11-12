// True 2D bounding-box spatial navigation for D-pad/remote input, kept in
// sync with mouse/Magic Remote pointer hover. Works off live DOM queries
// (`[data-focusable]`) rather than a pre-registered list, so it keeps
// working as layouts/the settings drawer mount and unmount elements.

const LG_BACK_KEYCODE = 461;

let currentEl = null;
let scopeEl = null; // non-null while a modal (settings drawer) is open
let preScopeEl = null; // focus to restore once the modal scope releases

function isVisible(el) {
  // getClientRects() alone catches `display:none`/zero-size, but a
  // visibility:hidden ancestor (e.g. the closed settings overlay) still
  // reports real rects for its descendants. `visibility` is an inherited
  // CSS property though, so checking the element's own computed value
  // also reflects an ancestor's hidden-ness correctly, as long as nothing
  // re-declares `visibility: visible` further down (nothing in this app
  // does).
  if (el.getClientRects().length === 0) return false;
  return getComputedStyle(el).visibility !== "hidden";
}

function focusableElements() {
  const root = scopeEl || document;
  return Array.from(root.querySelectorAll("[data-focusable]")).filter(isVisible);
}

function center(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function directionalScore(fromRect, toRect, direction) {
  const a = center(fromRect);
  const b = center(toRect);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Cross-axis distance is weighted higher so navigation prefers the
  // closest-aligned element in a row/column over a diagonal shortcut.
  switch (direction) {
    case "right":
      return dx > 0 ? dx + Math.abs(dy) * 2 : null;
    case "left":
      return dx < 0 ? -dx + Math.abs(dy) * 2 : null;
    case "down":
      return dy > 0 ? dy + Math.abs(dx) * 2 : null;
    case "up":
      return dy < 0 ? -dy + Math.abs(dx) * 2 : null;
    default:
      return null;
  }
}

function focus(el) {
  if (!el || el === currentEl) return;
  if (currentEl) currentEl.classList.remove("is-focused");
  currentEl = el;
  currentEl.classList.add("is-focused");
  try {
    // Keeps focus inside scrollable rows (e.g. the Apple TV app row) in
    // view. Wrapped defensively: the options-object form of scrollIntoView
    // is a newer addition and must not take down focus handling if it's
    // unsupported somewhere.
    currentEl.scrollIntoView({ block: "nearest", inline: "nearest" });
  } catch {
    /* no-op: focus still moved, just without auto-scroll */
  }
}

function moveFocus(direction) {
  const candidates = focusableElements();
  if (!currentEl || !candidates.includes(currentEl)) {
    focus(candidates[0]);
    return;
  }

  const isHorizontal = direction === "left" || direction === "right";
  const wrapContainer = isHorizontal ? currentEl.closest('[data-wrap="true"]') : null;
  // Inside a wrap-enabled row (the Apple TV app dock), Left/Right is locked
  // to that row's own tiles - up/down is how you leave it. Without this, a
  // row element that happens to sit almost directly above/below a tile
  // (here, the hero's Resume button over the first tile) can out-score the
  // intended in-row neighbor on pure geometry and hijack the move.
  const searchSpace = wrapContainer
    ? candidates.filter((el) => wrapContainer.contains(el))
    : candidates;

  const fromRect = currentEl.getBoundingClientRect();
  let best = null;
  let bestScore = Infinity;
  for (const el of searchSpace) {
    if (el === currentEl) continue;
    const score = directionalScore(fromRect, el.getBoundingClientRect(), direction);
    if (score !== null && score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  if (best) {
    focus(best);
    return;
  }
  if (wrapContainer && searchSpace.length > 1) {
    // DOM order matches left-to-right visual order for every row this is
    // used on.
    focus(direction === "right" ? searchSpace[0] : searchSpace[searchSpace.length - 1]);
  }
}

function activateCurrent() {
  if (currentEl) currentEl.click();
}

function handleKeydown(e) {
  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      moveFocus("up");
      break;
    case "ArrowDown":
      e.preventDefault();
      moveFocus("down");
      break;
    case "ArrowLeft":
      e.preventDefault();
      moveFocus("left");
      break;
    case "ArrowRight":
      e.preventDefault();
      moveFocus("right");
      break;
    case "Enter":
      e.preventDefault();
      activateCurrent();
      break;
    case "Escape":
    case "Backspace":
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("tv:back"));
      break;
    default:
      if (e.keyCode === LG_BACK_KEYCODE) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("tv:back"));
      } else if (e.key === "s" || e.key === "S") {
        window.dispatchEvent(new CustomEvent("tv:toggle-settings"));
      }
  }
}

function handlePointerOver(e) {
  const el = e.target.closest("[data-focusable]");
  if (!el) return;
  if (!focusableElements().includes(el)) return;
  focus(el);
}

export function initNavigation() {
  window.addEventListener("keydown", handleKeydown);
  document.addEventListener("pointerover", handlePointerOver);
}

// Restricts navigation to inside `container` (e.g. the settings drawer),
// remembering whatever was focused beforehand so `releaseScope()` can
// restore it rather than leaving focus on whatever happens to be first.
export function setScope(container) {
  preScopeEl = currentEl;
  scopeEl = container;
  const first = focusableElements()[0];
  if (first) focus(first);
}

export function releaseScope() {
  scopeEl = null;
  if (preScopeEl && document.contains(preScopeEl) && isVisible(preScopeEl)) {
    focus(preScopeEl);
  } else {
    focusFirst();
  }
  preScopeEl = null;
}

export function focusFirst(container) {
  // A modal scope owns focus until it releases; a background re-render
  // (e.g. switching layouts from inside the open settings drawer) must not
  // steal it.
  if (scopeEl) return;
  const root = container || document;
  const first = Array.from(root.querySelectorAll("[data-focusable]")).find(isVisible);
  if (first) focus(first);
}
