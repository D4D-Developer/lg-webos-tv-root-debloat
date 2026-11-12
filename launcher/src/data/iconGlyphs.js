// Hand-drawn line-icon set for app tiles, replacing raw emoji (inconsistent
// across platforms/fonts, and looked flat against the glass aesthetic).
// Deliberately generic shapes (play, film, tv, star, music, layers, globe),
// not brand logos - same reasoning as the hero atmosphere SVGs and the
// real webOS icon work: avoid embedding trademarked assets. `currentColor`
// means each glyph automatically picks up the tile's own `color: app.color`
// (components/appTile.js) with zero per-icon color logic needed.

export const GLYPHS = {
  film: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l1.5-4h3L6 8z"/><path d="M9 8l1.5-4h3L12 8z"/><path d="M15 8l1.5-4h3L18 8z"/><rect x="3" y="8" width="18" height="12" rx="1.5"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none"/></svg>`,
  tv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8M12 18v3"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.5l2.47 5.24 5.78.58-4.33 3.94 1.22 5.74L12 16.9l-5.14 3.1 1.22-5.74-4.33-3.94 5.78-.58z" fill="currentColor" fill-opacity="0.18"/></svg>`,
  playCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none"/></svg>`,
  music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor" stroke="none"/><circle cx="16.5" cy="16" r="2.5" fill="currentColor" stroke="none"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a7 7 0 0 0 10.2 10.2z" fill="currentColor" fill-opacity="0.18"/></svg>`,
  // The previous version of this (center dot + 8 full-length rays, no
  // enclosing ring) was literally a sunburst/brightness icon, not a gear -
  // missing the ring is exactly what made it read wrong. A gear needs a
  // solid body (the ring) with short teeth poking OUT of it, not rays
  // radiating all the way from the center.
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M19 12L20.8 12M16.95 16.95L18.22 18.22M12 19L12 20.8M7.05 16.95L5.78 18.22M5 12L3.2 12M7.05 7.05L5.78 5.78M12 5L12 3.2M16.95 7.05L18.22 5.78"/></svg>`,
};
