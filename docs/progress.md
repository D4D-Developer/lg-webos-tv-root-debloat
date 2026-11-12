# Project Status & Memory Bank

## Current Sprint / Immediate Focus
- [ ] Phase 3 — custom TV launcher ("homepage dashboard"): core shell built and
      passing local-browser testing; needs a UI pass once viewed on the real
      TV's actual Chromium engine before trusting the glass/theme look.

## 📋 The Board

### 🗓️ Up Next (Backlog)
- [ ] Verify the real input-switching path (`data/inputs.js`'s
      `getInputSources`) on an actual TV — whether HDMI inputs actually
      show up in `listLaunchPoints` at all (the whole feature's premise),
      and if so under what id/title pattern the regex needs to match. Now
      a header dropdown fed only by real discovery, no hardcoded fallback
      list — see "input switcher" below.
- [ ] Verify the real discovered-apps pinning path (`getPinnableApps()` in
      `data/apps.js`) on an actual TV — only the off-device static-catalog
      fallback is testable here. Also worth a look once there: whether the
      real installed-apps list is short/relevant or long/noisy with system
      apps (nothing filters it currently - see that function's comment).
- [ ] Compress/resize the wallpaper images before a real TV deploy — several
      in `nature-city/` are 1-3MB each (one is 3.2MB), well past the
      README's ~1920x1080 recommendation; fine for local dev, will slow the
      bundle/load on the actual TV.
- [ ] Verify Plex integration against a real Plex Media Server (CORS
      behavior, the on-deck JSON field shapes in `core/plex.js`, and the
      `file://`-style icon-path handling) — only mock-tested so far.
- [ ] If you want it, a free TMDB API key from themoviedb.org for the
      fallback path (`core/tmdb.js`) — currently untested against the real
      TMDB API (mocked in dev).
- [ ] Verify real webOS engine version on the TV (navigator.userAgent via
      Homebrew Channel web inspector) and narrow/relax the legacy build
      target in `launcher/vite.config.js` if it turns out newer than ~Chrome 53.
- [ ] Manually filling `appId`s into the static catalog
      (`launcher/src/data/apps.js`) is now optional, not required — Pinned
      Apps pins from the live discovered-apps list on a real TV instead
      (see "installed apps for pinning" below), whose ids are always real.
      The static catalog + its `appId: null` placeholders remain only as
      the local-dev/off-device fallback.
- [ ] Verify the exact format `listLaunchPoints`' `icon` field returns on
      this firmware (`core/icons.js` defensively prepends `file://` to a
      bare path, unconfirmed on-device).
- [ ] Decide + implement the actual TV deployment path (ares-package/ares-install
      as an installed webOS app vs. serving the built static files some other
      way) — not needed until local UI/UX is signed off.
- [ ] `appinfo.json` + icons for webOS packaging (only needed once deployment
      path above is decided).

### ⏳ In Progress / Blocked
- [ ] None currently — local dev build is working end-to-end.

### ✅ Completed
- [x] Phase 1 (root) and Phase 2 (debloat) — see docs/01-root.md, docs/02-debloat.md.
- [x] Phase 3 kicked off: `launcher/` scaffolded (Vite + vanilla JS/CSS, no
      framework), dev server running locally.
- [x] 4 themes, 3 switchable layouts (Apple TV default, Ambient Bento, Minimal
      Dock), unified status-bar telemetry pill (live Open-Meteo weather + AQI,
      fetch-timed latency, JS heap mem), spatial D-pad navigation synced with
      mouse hover, slide-over Settings drawer with localStorage persistence,
      OLED pixel-shift (auto + manual) and OLED Sleep ambient mode.
- [x] Verified in a real browser: all 3 layouts render correctly, settings
      persist across reload, OLED Sleep enters/exits, telemetry pulls live data.
- [x] Polish pass: cinematic Top Shelf backdrops (layered SVG atmosphere +
      Ken Burns + crossfade), focus memory across the Settings drawer +
      wrap-around on the app dock, resilient weather/AQI caching for instant
      cold-boot paint. See "2026-11-12 (polish pass)" below.
- [x] Real webOS app icons (`core/icons.js`): resolved at runtime via the
      same `listLaunchPoints` Luna call used for app IDs, falls back to
      emoji everywhere that isn't true (off-device, unset `appId`, or a
      failed image load). Zero visual change confirmed in local testing
      (expected — only activates on a real TV).
- [x] Real hero content: Plex "On Deck" (`core/plex.js`) as the primary
      source, TMDB trending (`core/tmdb.js`) as a fallback, demo slides as
      the final fallback and default. Toggle + Plex/TMDB credential fields
      added to Settings ("Hero Content" section, off by default). Verified
      end-to-end with a mocked TMDB response (real fetch untested — no live
      Plex/TMDB connection available during dev).
- [x] Wallpaper system (`core/wallpapers.js`, `components/wallpaperStack.js`):
      auto-discovers any image dropped in `src/assets/wallpapers/` (user
      sources/downloads these themselves — see that folder's README) via
      Vite's `import.meta.glob`, combined with built-in generated gradients,
      shuffled on a timer with crossfade. Used in two places: the dashboard
      background (full brightness, dark scrim for legibility) and OLED
      Sleep's screensaver (heavily dimmed, ~12 min then reverts to pure
      black for burn-in protection — user-approved tradeoff). New
      "Wallpaper" Settings toggle, on by default. Verified in-browser:
      dashboard rendering, dimmed screensaver rendering/opacity, sleep/wake/
      re-sleep cycle, and the Settings toggle both directions.
- [x] Wallpaper categories: `src/assets/wallpapers/` now groups images by
      subfolder (you'd already created `cars/`, `comic/`, `nature-city/`
      with real photos before this was asked for) — the subfolder name
      becomes a category, auto-discovered and listed in Settings -> Wallpaper
      with its own on/off toggle, independent of the others and of the
      built-in "Default (generated)" gradients. Verified: real photos now
      render in the dashboard/screensaver shuffle (confirmed via screenshot),
      and toggling a category off correctly removes it from the pool.
- [x] 11 more `comic/` images added (now 19; `cars`/`nature-city` unchanged,
      36 custom images total) — no code change needed, auto-discovery
      already handles it. Verified the new files (avengers endgame.jpeg,
      Ironman.jpeg, etc.) actually appear in the live shuffle.
- [x] UX feedback round: fixed a real bug (clock pill's date line was
      getting clipped — `.clock-pill` inherited `.pill`'s fixed `height:
      48px`, too short for 2 lines); dropped "OLED" from the input badge and
      the theme section label (kept it on "OLED Sleep"/"OLED Pixel-Shift",
      where it's load-bearing — see decision below); confirmed the greeting
      already changes by time of day (no change needed); replaced emoji app
      icons with a hand-drawn SVG line-icon set (`data/iconGlyphs.js`,
      `components/iconGlyph.js`) tinted via each app's existing brand color,
      used consistently in tiles and the Settings pinned-apps list; added a
      glossy top-highlight + lift shadow to all app tiles, all layouts, all
      themes. Found and fixed a real contrast bug while testing: Apple TV+'s
      `#222222` was invisible as an actual icon stroke color (was fine as an
      emoji tint, emoji carry their own color) — changed to a light gray.
- [x] Minimal Dock: the app dock now pins to the bottom of the screen
      instead of being vertically centered as a group with the clock/
      weather — the clock/weather wraps in a new `flex:1` content container
      that centers itself in the space above the dock, with the dock left
      as a normal last flex item. Verified via screenshot.
- [x] Geolocation-based weather (`core/geolocation.js`): new "Use current
      location" Settings toggle (off by default, so an existing user's
      already-configured city doesn't silently change), resolves via the
      browser Geolocation API + a free reverse-geocode lookup for the
      display name, falls back to the previously configured city on any
      failure. Verified the fallback path works correctly (permission
      wasn't grantable in this automated test environment, request timed
      out, app fell back cleanly with no errors). **Update:** between
      sessions, `city` showed up resolved to "Dadri" with real-looking
      coordinates not matching any preset or test value - strong evidence
      the success path works too (you testing it in a real browser, where
      the permission prompt is actually answerable).
- [x] Split wallpaper/screensaver category selection: replaced the single
      `enabledWallpaperCategories` with independent
      `dashboardWallpaperCategories`/`screensaverWallpaperCategories` -
      every category gets its own Dashboard/Screensaver pill pair in
      Settings, not tied to any particular folder-naming scheme. You'd
      already created a `motivational/` category folder matching your own
      suggestion; left it configured as you described (dashboard off,
      screensaver on) rather than reverting it after testing, since that's
      what was actually asked for. Verified: the dashboard pool genuinely
      excludes it (sampled 6 random rotations, none were motivational
      images) while the screensaver setting stays untouched (`null` =
      still eligible there).
- [x] Settings panel cleanup: grouped the 7 flat sections into 6
      collapsible groups (Appearance, Weather, Pinned Apps, Wallpaper &
      Screensaver, Hero Content, Display Care) - "Appearance" open by
      default, rest collapsed. Verified via screenshot: the drawer now
      shows as a short list of headers instead of one long scroll through
      every control at once.
- [x] Removed geolocation ("Use current location") entirely -
      `core/geolocation.js` deleted, `useDeviceLocation` setting and all its
      wiring removed. Weather/AQI City is 4 fixed presets again: Dadri (new
      default, real coordinates from the earlier session's successful
      geolocation test, not a guess), Delhi, Bengaluru, Hyderabad.
- [x] Installed TV apps for pinning: Settings -> Pinned Apps now lists the
      TV's real installed apps (via the same `listLaunchPoints` call
      already used for icons - `core/icons.js`'s `getDiscoveredApps()`,
      `data/apps.js`'s `getPinnableApps()`) when on-device, falling back to
      the static 8-app demo catalog off-device. A pinned app that no longer
      matches anything pinnable (e.g. first boot on a real TV, where
      discovered ids don't match the old static-catalog defaults) falls
      back to the first few real apps rather than an empty dock. Verified
      the off-device fallback path only (static catalog renders correctly,
      no regression) - the real discovered-apps path needs an actual TV.
- [x] Weather effects (rain/fog/snow/storm overlay from the next-3-hours
      forecast): `core/telemetry.js` now requests Open-Meteo's hourly
      forecast too and classifies the worst upcoming condition;
      `components/weatherEffects.js` renders a subtle CSS-only
      (`transform`/`opacity` only, consistent with every other animation in
      this app) overlay - rain streaks, drifting fog, falling snow, a
      periodic lightning flash for storms. New "Weather effects" Settings
      toggle, on by default. **Found and fixed a real bug via testing**:
      Open-Meteo's hourly timestamps have no timezone marker, and
      `new Date(thatString)` parses them as the *browser's* local time, not
      the selected city's - broke the "next 3 hours" window for any city
      not sharing the device's timezone. Fixed with `timezone=auto` +
      manually parsing against the response's own `utc_offset_seconds`.
      Verified end-to-end with a mocked forecast (storm 2 hours out, in a
      timezone deliberately different from the test browser's own) -
      correctly classified and rendered only after this fix; initial
      testing attempts appeared to fail but turned out to be a Vite
      HMR-timing artifact in my own test sequencing, not a second bug.
- [x] UX feedback round: renamed default city "Dadri" -> "Gr. Noida West" (same
      real coordinates, just the display name - updated both the default
      and the already-persisted stored value). Fixed a real CSS bug: every
      collapsible group's header-to-content gap was either zero or missing
      entirely (`.settings-group__body` never had its own `margin-top`;
      the old fix only zeroed `.settings-section:first-child`, which most
      groups' content isn't) - now a single `margin-top` on the body fixes
      every group uniformly, verified via screenshot on 3 different groups.
      "OLED Sleep" status-bar button relabeled to "Sleep" with a proper
      SVG moon glyph instead of the 🌙 emoji (the internal/technical name
      and docs keep "OLED Sleep" throughout - only the glanceable top-bar
      label shortened); also swapped the Settings gear emoji for a
      matching SVG glyph while in the file, for full consistency with the
      icon system already built for app tiles.
- [x] You directly edited `core/settings.js` between sessions to refine the
      default city name further, "Gr. Noida" -> "Gr. Noida West" (same
      coordinates) - noted as current state, not reverted.
- [x] Found and fixed a real bug: changing the city (or anything else) in
      Settings never told `core/telemetry.js` to refetch - it only applied
      on the next scheduled 5-minute tick, which is why a manual page
      reload seemed to be required to see a new city's weather. Settings'
      `onChange` handler now also calls `telemetry.refreshNow()`, matching
      the pattern already used for hero content. Verified live (changed
      city to Hyderabad, weather updated with no reload, then reset back).
- [x] Removed the "HDMI 1 · 55″" status-bar badge - it never tracked a real
      input and was actively misleading given this app is reached via the
      Home button remap, not as an input overlay (your framing, which I
      agreed with). Built a real (if on-device-unverified) replacement
      instead of just deleting it: a new "Input Source" Settings group
      (`data/inputs.js`) that tries to find real inputs in the existing
      discovered-apps list first (webOS likely treats HDMI inputs as
      launchable "apps" the same way regular apps are, matching how LG's
      own Home screen appears to work), falling back to a generic HDMI 1-4
      placeholder list - exact same `appId: null`, dev-fallback-logs
      pattern already used for the app catalog. Verified the off-device
      fallback path (clicking a pill correctly dev-fallback-logs, no
      crash) - the real discovered-input path needs an actual TV.
- [x] UX feedback round: (1) Input source moved out of Settings entirely
      into a new header dropdown (`components/inputSwitcher.js`) next to
      the clock, for one-step switching; `data/inputs.js`'s hardcoded
      HDMI 1-4 placeholder fallback removed outright per explicit
      instruction - off-device it now honestly shows "No inputs detected on
      this TV yet" rather than a guessed list. (2) Screensaver wallpaper
      shuffle sped up 45s -> 10s and its dimmed opacity raised 0.18 -> 0.4
      (`core/oled.js`, `styles/wallpaper.css`). (3) Status-bar Clock/Sleep
      pill positions swapped (`components/statusbar.js`). (4) Found a real
      bug: the "settings" SVG glyph was literally a sunburst icon (center
      dot + 8 full rays, no enclosing ring) - replaced with a proper
      gear/cog (`data/iconGlyphs.js`). Verified all 4 in-browser: input
      dropdown opens/closes and mutual-excludes correctly against Settings
      (both directions + Escape), gear reads correctly when zoomed, 10s
      rotation confirmed via MutationObserver (layers append exactly
      10000ms apart), 0.4 opacity confirmed once the crossfade settles.
- [x] UX feedback round: (1) Header clock switched from 24-hour to 12-hour
      with AM/PM (`formatClock` in `components/statusbar.js`; the OLED
      Sleep ambient clock in `core/oled.js` updated to match, now with an
      explicit `hour12: true` instead of relying on locale default). (2)
      Clock/date pill changed from two stacked lines back to a single
      horizontal row with the time and date spread apart
      (`styles/statusbar.css`'s `.clock-pill`), since the two-line layout
      was only ever needed for the vertical stack. Verified via screenshot:
      "2:03 PM · Thu, Nov 12" in one row.
- [x] Screensaver (OLED Sleep) reworked per explicit request to not block
      the artwork: clock moved from dead-center to bottom-right with the
      existing `--safe-margin` token, and new Date + Weather lines added
      below it (`core/oled.js`'s `updateTelemetry()`, fed from the same
      telemetry loop that already updates the status bar - so the text is
      correct the instant Sleep starts, not just after the next tick).
      The existing clock-drift animation (`core/oled.js`'s `driftClock`)
      now moves the whole clock+date+weather block together
      (`.oled-sleep__info`) instead of just the clock, so the group
      doesn't separate as it drifts. Verified in-browser: correct text for
      all three lines, bottom-right placement with margin via screenshot,
      drift transform still changing every 8s, dimmed wallpaper shuffle
      underneath unaffected.

---

## 🧠 Architectural Decisions & Context Cache
*(This section prevents Claude from re-arguing past decisions in new sessions)*

- **2026-11-12:** Custom launcher built as vanilla JS/CSS + Vite (dev server
  and legacy-targeted bundler only, not a framework). Real webOS 4.x hardware
  is commonly cited as running ~Chromium 53 (2016), which has no native
  `<script type="module">` support — a framework-heavy SPA risked not running
  on-device at all. `@vitejs/plugin-legacy` (targets `chrome >= 53`) produces
  a transpiled/polyfilled fallback bundle for the TV while modern browsers
  (dev server, desktop testing) use the fast native build.
- **2026-11-12:** No CSS Grid, no flex `gap`, no `aspect-ratio`/`inset`
  shorthand anywhere in `launcher/src/styles/` — all land in Chromium after
  ~53 (Grid: 57, flex gap: 84, aspect-ratio/inset: 87-88) and would silently
  break spacing/proportions on the real TV. Spacing uses `> * + *` margin
  instead of `gap`; tile sizes are fixed px instead of `aspect-ratio`.
- **2026-11-12:** `backdrop-filter` glass panels (`.glass-panel` in
  `glass.css`) are wrapped in `@supports`, with a solid-tint fallback for
  browsers without it (i.e. the real TV) so the UI still looks intentional
  there, not broken — just without blur.
- **2026-11-12:** App launch IDs in `launcher/src/data/apps.js` are
  placeholders (`appId: null`) by design, not guessed. Real webOS system app
  IDs must come from the TV itself (`luna-send -n 1 -f
  luna://com.webos.applicationManager/listLaunchPoints '{}'` over SSH).
  `launcher/src/core/platform.js` falls back to opening the app's website in
  dev/desktop testing when no real ID is set.
- **2026-11-12:** Default weather/AQI city is a placeholder assumption
  ("Bengaluru, IN", in `launcher/src/core/settings.js`) based on the pinned
  app list including JioHotstar — confirm/change via Settings, not hardcoded
  as fact.
- **2026-11-12:** Per docs/03-ui-ux-notes.md's prior research, there is no
  known way to make this the TV's actual registered Home app — it will
  always be a separate app, reached via manual launch or the LG Input Hook
  Home-button remap (that doc's option 3). Doesn't affect frontend work, only
  how it's eventually invoked on the TV.
- **2026-11-12 (polish pass):** Hero atmosphere blur uses inline SVG
  `<feGaussianBlur>`, not CSS `filter`/`backdrop-filter` — supported in even
  very old Chromium, so it doesn't need the `@supports` fallback the glass
  panels require. Ken Burns motion animates `transform: scale()` only (per
  the request, for GPU compositing); apparent pan direction comes from
  varying `transform-origin` per slide instead of adding `translate`.
- **2026-11-12 (polish pass):** Inside a row marked `data-wrap="true"` (the
  Apple TV app dock), Left/Right is locked to that row's own tiles rather
  than competing with outside elements on raw geometry — found during
  testing that the hero's Resume button sits close enough above the first
  tile to win "left" by score and hijack the move before wrap-around could
  kick in. Up/Down remains the only way in/out of the row.
- **2026-11-12 (polish pass):** Fixed a focus-visibility bug while adding
  focus memory: `getClientRects().length > 0` alone doesn't detect a
  `visibility: hidden` ancestor (the closed Settings overlay), so its
  buttons stayed "focusable" after closing. Now also checks the element's
  own computed `visibility`, which inherits the ancestor's hidden state.
- **2026-11-12 (polish pass):** Only weather/AQI are cached
  (`localStorage`, keyed by city) for instant cold-boot paint - latency and
  memory are inherently point-in-time measurements and stay blank until the
  first real fetch completes, by design, not an oversight.
- **2026-11-12 (real content):** Icons resolve at runtime via
  `listLaunchPoints` (matched against the already-known `appId`), not by
  hand-copying icon paths alongside IDs over SSH — stays correct if the OS
  ever moves them, and it's zero licensing risk since these are the TV's own
  icon files, not redistributed brand assets.
- **2026-11-12 (real content):** Plex is the primary hero-content source
  (your own media, your own server, no third-party ToS risk) with TMDB
  trending as a fallback for when Plex has nothing on deck — TMDB content is
  generic/non-personalized, explicitly a "just in case" fallback, not the
  primary experience. Netflix/Prime/Hotstar "continue watching" was ruled
  out entirely: no public API exists for any of them.
- **2026-11-12 (real content):** Plex server URL/token and the TMDB API key
  are Settings-entered values stored only in `localStorage`, never hardcoded
  or committed — same "no secrets" rule as the rest of this repo, since a
  Plex token and a LAN server IP both count as the kind of device-identifying
  info the README says to keep out of this repo.
- **2026-11-12 (real content):** Both Plex and TMDB auth go through the
  query string (`?X-Plex-Token=`/`?api_key=`), matching each service's own
  common usage pattern and avoiding a CORS preflight. The header form
  (`X-Plex-Token` header) is slightly more defensible against URL/log
  leakage if this gets hardened later, but query-string keeps things simple
  for a personal LAN app — flagging the tradeoff rather than silently
  picking one.
- **2026-11-12 (real content):** Settings' text inputs (Plex/TMDB fields)
  commit on blur (Enter/Escape), not on every keystroke — the drawer's other
  controls all call a full `render()` after each change, which would
  destroy and recreate an `<input>` mid-type and lose focus. Found and fixed
  a real bug building this: `navigation.js` activates the spatial-nav
  selection via `currentEl.click()`, which does NOT reliably give native
  DOM focus to an input (a common misconception - click() isn't guaranteed
  to focus the way a real pointer click is). Each input now focuses itself
  explicitly on click. Every keydown in a text field also stops propagation,
  or the global D-pad handler would hijack arrows/Enter/Backspace, and
  typing a literal "s" would toggle Settings mid-edit.
- **2026-11-12 (wallpapers):** You download/source wallpaper images
  yourself and drop them in `src/assets/wallpapers/` — Claude does not
  fetch/download images from the internet on your behalf for this. Mirrors
  the Plex/TMDB credential pattern: keeps sourcing/licensing responsibility
  with you, not embedded by Claude.
- **2026-11-12 (wallpapers):** OLED Sleep's wallpaper shuffle stays heavily
  dimmed (~18% opacity) and reverts to pure black after 12 minutes of
  continued idle, rather than shuffling indefinitely at full brightness —
  user-chosen tradeoff (asked via AskUserQuestion) that keeps most of OLED
  Sleep's original burn-in-protection intent instead of undermining it. The
  dashboard background (not idle/screensaver use) has no such restriction.
- **2026-11-12 (wallpapers):** The wallpaper layer is positioned with
  `z-index: -1`, not just `position: absolute` — within #app's stacking
  context (established by its own `transform`), in-flow static content
  (status bar, layouts) paints *before* positioned descendants at
  z-index:auto/0 regardless of DOM order, so plain absolute positioning
  alone would have put it on top of everything else.
- **2026-11-12 (wallpapers):** Subfolders of `src/assets/wallpapers/` are
  categories, not just organization - `core/wallpapers.js` discovers them
  via a recursive glob and the subfolder name becomes the category shown in
  Settings. `enabledWallpaperCategories` defaults to `null` ("everything
  enabled") rather than a hardcoded array, since the actual category list is
  only known at build time from whatever folders exist; it only becomes a
  concrete array once something is toggled off.
- **2026-11-12 (UX feedback):** Countered the request to drop "OLED" from
  headers entirely: kept it on "OLED Sleep" and "OLED Pixel-Shift" (it
  names *why* those features behave the way they do - dimming, pixel-shift,
  reverting to black - not just decoration), dropped it from the input
  badge ("HDMI 1 · OLED55" -> "HDMI 1 · 55″", redundant/cosmetic) and from
  "Glass & OLED Theme" -> "Glass Theme" (that section only ever held the 4
  color-palette pills, never OLED-specific controls - the label was
  inaccurate for what's actually in it, not just verbose).
- **2026-11-12 (UX feedback):** App icons are self-authored inline SVG line
  icons (`data/iconGlyphs.js`), not real brand logos or a copied icon
  library - same reasoning as the hero atmosphere SVGs and the real-icon
  work: avoid embedding trademarked assets, and avoid depending on an
  external icon-font CDN (this has to work offline on the TV). Generic
  concept per app (play, film, tv, star, etc.), tinted via `currentColor`
  from each app's own `color` already defined in `data/apps.js`.
- **2026-11-12 (geolocation):** `useDeviceLocation` defaults to `false`
  despite being the better experience when it works - it's a NEW settings
  field, and since settings load as `{...DEFAULTS, ...parsed}`, defaulting
  it `true` would silently start requesting geolocation (and overriding an
  already-correct manually-picked city) for an *existing* user whose stored
  settings just predate this field. New users opt in via Settings.
- **2026-11-12 (geolocation):** Resolution is fire-and-forget at boot, not
  awaited - unlike icons (which must resolve before the first tile paint),
  geolocation + reverse-geocode can take several seconds and nothing else
  depends on it being done early. Boot proceeds with whatever city was
  already configured; `telemetry.refreshNow()` picks up the resolved one
  once/if it lands. The Settings onChange handler tracks the toggle's
  previous value (`knownUseDeviceLocation`) so it only re-resolves on the
  actual off->on transition, not on every unrelated settings change (which
  would otherwise mean repeated permission prompts/network calls).
- **2026-11-12 (wallpaper/screensaver split):** Countered the suggested
  mechanism, not the goal: rather than a dedicated "motivational" folder
  that only gets excluded from one context by convention, every category
  gets an independent Dashboard/Screensaver toggle
  (`dashboardWallpaperCategories`/`screensaverWallpaperCategories` in
  `core/wallpapers.js` and `core/settings.js`). Covers the exact request
  (group text-heavy images and flag them screensaver-only) without forcing
  a specific folder-naming scheme, and also covers any other existing
  category hitting the same problem. Per-category, not per-image: with
  36+ images, individual toggles would be an impractical wall of controls.
- **2026-11-12 (settings cleanup):** Collapsible groups
  (`settingsDrawer.js`'s `group()` helper) are ephemeral UI state (a
  module-level `Set`, not persisted to `settings.js`/`localStorage`) -
  which sections are expanded is about decluttering this one session's
  view, not a preference worth remembering across reloads. "Appearance" is
  open by default so the drawer isn't completely blank on first open; the
  rest start collapsed.
- **2026-11-12 (geolocation removal):** Fully deleted rather than left
  disabled/hidden - an unused module contradicts this project's existing
  "no dead code" convention. Its real resolved coordinates for Dadri were
  salvaged as the new `DEFAULT_CITY` rather than discarded.
- **2026-11-12 (installed apps):** The static demo catalog
  (`data/apps.js`'s `APPS`) is kept, not replaced - it's now purely the
  off-device/local-dev fallback, since there's nothing to discover without
  a real TV. `getPinnableApps()` is the single seam that decides which
  source is active; nothing else needs to know. A discovered app's `appId`
  is always the TV's own real id (never guessed), so the old "SSH to find
  IDs, hand-fill the catalog" workflow is no longer required to make
  pinning/launching work on-device - only still useful for the catalog's
  own off-device fallback entries.
- **2026-11-12 (weather effects):** Only `transform`/`opacity` animate
  (rain fall, snow drift, fog pan, lightning flash via opacity), matching
  every other animation already in this app (hero Ken Burns, crossfades) -
  deliberate GPU-compositing discipline for the TV's weak hardware, not
  requested explicitly this time but consistent with the standing
  "GPU-friendly" requirement from the original design brief.
- **2026-11-12 (weather effects):** The forecast classification is
  deliberately NOT cached alongside temperature/AQI - a stale "it might
  rain" prediction from an old cache read is actively misleading in a way
  a stale temperature reading isn't, so it resets to "clear" on every cold
  boot until the real fetch resolves.
- **2026-11-12 (Sleep label):** Refines, doesn't reverse, the earlier "keep
  OLED in names that describe behavior" decision - the distinction that
  actually matters is glanceable-top-bar-button vs. detailed-Settings-list,
  not the feature itself. "OLED Pixel-Shift" stays precise in Settings,
  where there's room and reason for it; the status-bar button is a quick
  glance at a moon icon, where "Sleep" alone is enough and "OLED" was just
  noise. Code, CSS classes, and docs all keep the "OLED Sleep"/`oled-sleep`
  naming throughout - only this one user-facing label changed.
- **2026-11-12 (input switcher):** Input switching is not a persisted
  setting - unlike theme/layout/city, there's no "currently selected
  input" this app can actually know or display, only a command to send
  (same reasoning as OLED Pixel-Shift's "Shift now" button). Reuses
  `core/platform.js`'s existing `launchApp()` unchanged, since webOS
  inputs and regular apps appear to share the exact same
  `applicationManager/launch` Luna mechanism.
- **2026-11-12 (input switcher v2):** No hardcoded input-source fallback,
  unlike every other discover-then-fallback seam in this app (apps,
  icons). A wrong-looking but plausible HDMI 1-4 list is worse than an
  honest empty state here, since the user would have no way to tell a
  guessed input apart from a real one until they actually tried switching
  to it - different from the app catalog's fallback, which is clearly a
  demo/dev aid, not something a user would mistake for real TV state.
- **2026-11-12 (input switcher v2):** The Input dropdown and the Settings
  drawer share `navigation.js`'s single focus-scope singleton
  (`setScope`/`releaseScope`), so only one can own it at a time. Resolved
  with an `onBeforeOpen` callback (each closes the other before opening)
  plus updated `tv:toggle-settings`/`tv:back` handlers in `main.js` - the
  general pattern for any future modal-like surface added alongside these
  two.
- **2026-11-12:** Claude has standing authorization to make changes to this
  repo across sessions without per-change approval, and to bring up/use a
  local dev server for testing — see `CLAUDE.md` (local, gitignored) and
  docs/handoff.md. Git commits remain explicit-approval-only per global
  policy; nothing in this project has been committed yet.
