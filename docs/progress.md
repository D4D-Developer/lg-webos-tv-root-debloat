# Project Status & Memory Bank

## Current Sprint / Immediate Focus
- [x] Phase 3 — custom TV launcher ("homepage dashboard"): **deployed and
      confirmed running on the real TV** (app id `com.tvdashboard.home`),
      real engine confirmed Chrome 53.0.2785.34 (matches the legacy build
      target exactly, no change needed). See docs/handoff.md for the full
      current-state writeup and the "2026-11-12 (real TV deploy)" entries
      below for how it got there.
- [ ] Your call: LG Input Hook (Home-button remap) — deferred this round
      over its attack-surface tradeoff, see docs/handoff.md's "Deferred"
      section.

## 📋 The Board

### 🗓️ Up Next (Backlog)
- [x] ~~Verify the real input-switching path on an actual TV~~ — verified,
      and **permanently blocked** on this firmware, not just untested:
      `listLaunchPoints` (the whole feature's premise) is Luna Bus
      permission-denied for a devmode-sideloaded web app's own JS context
      (`{"errorText":"Denied method call \"listLaunchPoints\" for category
      \"/\""}`). Stays in its honest empty state by design — see
      docs/handoff.md's "Known limitation" for the full writeup and the
      one untried mitigation idea (proxying through a privileged helper).
- [x] ~~Verify the real discovered-apps pinning path~~ — same root cause
      and same verified-permanent conclusion as above: `getPinnableApps()`
      correctly falls back to the static catalog on-device, not because
      it's untested but because live discovery is genuinely blocked here.
      Real appIds for pinning now have to come from the SSH-based
      `listLaunchPoints` lookup (full privileged access, unlike the app's
      own restricted identity) and be hand-filled into `data/apps.js` —
      see docs/handoff.md's "What remains" #2.
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
- [x] ~~Verify real webOS engine version on the TV~~ — confirmed via the
      TV's own remote DevTools inspector (`http://<tv-ip>:9998/json`, no
      app code involved): `Chrome/53.0.2785.34`, exactly matching the
      `chrome >= 53` legacy build target already in `vite.config.js`. No
      change needed there.
- [x] ~~Manually filling `appId`s is optional~~ — reversed: it's **required
      again**, not optional, now that live discovery is confirmed
      permanently blocked (see the two backlog items above). The static
      catalog + `appId: null` placeholders are still the off-device
      fallback; on-device they're now also the only path to real appIds,
      filled by hand via the SSH `listLaunchPoints` lookup.
- [ ] Verify the exact format `listLaunchPoints`' `icon` field returns on
      this firmware — can't be checked from the app's own JS (permission
      denied, see above); would need the SSH-based lookup instead if this
      still matters given icons already fall back to the SVG glyph set.
- [x] Decide + implement the actual TV deployment path — **done**. Not
      quite the originally-assumed `ares-install` (its devmode SSH session
      wouldn't stay up on this TV — see docs/handoff.md), but `ares-package`
      plus the officially-documented manual `luna-send-pub .../dev/install`
      path over the already-working root SSH. Same net result: a real
      installed webOS app, not a side-served static site.
- [x] `appinfo.json` + icons for webOS packaging — **done**, in
      `launcher/public/` (copied into `dist/` by Vite automatically). App
      id `com.tvdashboard.home`, icon is a simple generated dark-glass +
      accent 2×2 tile grid matching the app's own look (no external/brand
      assets, consistent with the icon-glyph decision below).

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
- [x] **Real TV deploy (2026-11-12):** Packaged (`ares-package`) and
      installed `com.tvdashboard.home` on the actual rooted TV, confirmed
      running on the real engine via the TV's own remote DevTools
      inspector (`http://<tv-ip>:9998/json`) rather than guessing: real
      `navigator.userAgent` is `Chrome/53.0.2785.34` on Web0S/Linux,
      exactly matching the existing legacy build target; the app renders
      correctly (6 root children mounted under `#app`, correct dark theme
      background). `ares-install`'s devmode SSH session (port 9922)
      wouldn't stay listening on this TV no matter what was tried
      (Dev Mode Status toggle, Key Server toggle, full reboot - each
      diagnosed live over the already-working root SSH, not guessed), so
      installs went through the Homebrew Channel README's own documented
      manual fallback instead: `luna-send-pub .../dev/install` with a
      local `ipkUrl`, run over root SSH. Also fixed 6 wallpaper filenames
      containing non-ASCII characters (ellipsis, em dash, emoji, curly
      quote) that made `ares-package` hard-fail - see decision log below
      for the full list and renaming approach. Full session narrative,
      the devmode-vs-manual-install path, and the pty/`luna-send` gotcha
      live in docs/handoff.md - this entry is the permanent summary.
- [x] **Real TV deploy - webOS bridge fix (2026-11-12):** Found (by
      checking `window.webOS` on the real device page via the DevTools
      inspector, not assumed) that `window.webOS` **did not exist at all**
      on-device - LG's `webOSTV.js` helper library was never included in
      `index.html`, so `isWebOS()` was always false and every Luna call
      silently used the dev fallback even when genuinely running on the
      TV. Added `launcher/src/core/webosBridge.js`, a ~30-line hand-written
      shim defining just the one call shape the app uses
      (`window.webOS.service.request(uri, {method, parameters, onSuccess,
      onFailure})`) directly on top of webOS's natively-injected
      `PalmServiceBridge` - see the dependency-vs-hand-write decision
      below for why not the `webostvjs` npm package. Verified fixed via
      live DevTools eval, not just code review: `window.webOS` went from
      `false` to `true`, and a real `launch` call round-tripped
      successfully. Also found, in the same verification pass, that
      `listLaunchPoints` is Luna Bus permission-denied on this firmware
      for a devmode-sideloaded app regardless of this fix - see the
      backlog entries above and docs/handoff.md's "Known limitation" for
      the full writeup; `requiredACG` in appinfo.json made no difference
      (LG's own ACG guide says that mechanism doesn't apply below webOS TV
      25, so the denial is almost certainly the older, pre-ACG Luna Bus
      category/role-file permission system).
- [x] **On-TV feedback round 1 (2026-11-12):** First real-usage feedback
      after the deploy above, all fixed - see docs/handoff.md for the full
      writeup, summary here: (1) header/settings-icon sizing bumped up in
      `statusbar.css`. (2) Wallpaper rotation bug root-caused to EXIF
      orientation tags that Finder auto-applies but this TV's Chrome 53
      engine never did (added support for that years later) - 22 images
      fixed with `magick -auto-orient`, baking the rotation into the pixel
      data itself rather than relying on any viewer honoring the tag. (3)
      Netflix (and the rest of the static catalog) now carry real appIds
      from the SSH `listLaunchPoints` lookup - verified by actually
      launching Netflix from the dashboard. (4) App tile labels were only
      ever visible on focus (`opacity:0` default, `is-focused`-only
      reveal) and the Bento/Minimal Dock layouts didn't render them at
      all (`showLabel: false`) - fine when real per-app icons were
      expected, broken once icon discovery was confirmed permanently
      blocked on this TV and most tiles share a generic glyph. Now always
      visible everywhere, as an in-bounds gradient-backed overlay band
      rather than extra space below the tile, so no layout's grid/row
      spacing needed reworking. Also removed Spotify (not actually
      installed on this TV) and added the other 12 real installed apps to
      the catalog, none auto-pinned by default - see the decision log
      below for both.
- [x] **On-TV feedback round 2 (2026-11-12):** Three more issues from
      real usage, all confirmed live via DevTools before fixing (not
      guessed) - full detail in docs/handoff.md:
      1. "Screen flickers constantly" - the Hero Content carousel was
         cycling 3 demo slides every 9s, forever, by design but far too
         fast for an ambient background element; confirmed via a live
         MutationObserver before touching code. Slowed 9s → 25s.
      2. Minimal Dock icon/label sizing bumped up - and while verifying it
         live, found **a real Chrome-53 engine bug**: percentage `height`
         silently fails to resolve on these nested flex icon elements
         (width resolves fine, height comes back as nearly the full tile
         height instead) - this had been broken in every layout since the
         icon-glyph system was built, invisible in local/desktop-browser
         testing (where percentages work fine) because this project had
         no TV to test against until this session. Fixed by switching
         every layout's icon sizing from % to fixed px, computed per that
         layout's actual fixed tile size.
      3. Settings navigation "broken" - also a real engine incompatibility:
         `scrollIntoView({block, inline})`'s options-object form postdates
         Chrome 53; passing it doesn't throw (so the existing try/catch
         never caught it), it silently gets coerced into the legacy
         boolean API and force-scrolls the focused element to the very
         top of its container on every single focus move, even when
         already fully visible - confirmed live (scrollTop jumped
         50→757 for an on-screen element). Pre-existing bug, only became
         obviously disruptive once the Pinned Apps list grew to 19 items
         this session. Replaced with a hand-written nearest-scroll
         implementation using only universally-supported APIs.

- [x] **App tile label color (2026-11-12, v1.0.7):** `.app-tile__label`
      had no explicit `color`, so it inherited `color: app.color` from the
      tile's own inline style - each label was tinted the app's accent
      color rather than reading as plain white text. Set explicitly to
      `#fff`. Verified live: all rendered labels report
      `rgb(255, 255, 255)`.
- [x] **Apple TV icon width tweak (2026-11-12, v1.0.8):** `.app-row
      .app-tile__icon-glyph` width 112px → 95px (height unchanged, 63px).
      Verified live: `95×63` exactly.
- [x] **Performance: 45 always-on background animations fixed (2026-11-12,
      v1.0.9 → v1.0.10):** Asked why remote navigation felt slow. Measured
      `navigation.js`'s actual handler execution live (10 real
      `ArrowRight` dispatches, timed): ~9-10ms per press, not the
      bottleneck - but that only covers JS execution, not the real
      physical-remote-to-browser-event pipeline, which can't be simulated
      from here. Found instead that `weatherEffects.js`'s rain (24 drops)
      /snow (18 flakes)/fog/lightning layers, and all 3 of
      `appleTvLayout.js`'s hero Ken Burns backdrops, were running their
      CSS `animation`s continuously **regardless of visibility** - CSS
      animations don't pause themselves just because `opacity: 0` hides
      them. Confirmed live via `animationPlayState` before touching code:
      `"running"` for all of them even at the default/common
      `data-condition="clear"` state, and for 2 of 3 backdrops that are
      never the active slide. 45 elements doing continuous GPU/compositor
      work for zero visual benefit most of the time is a real,
      substantial resource drain on this TV's weak/old hardware - a
      plausible (not provably certain, see the honest caveat in
      docs/handoff.md) contributor to sluggish input response. Fixed with
      `animation-play-state: paused` by default, `running` only when the
      matching condition/active-state actually applies. The hero fix
      worked first try; the weather-effects fix did NOT on the first
      attempt (still `"running"` after deploying) - caught by
      re-verifying on-device rather than trusting the CSS looked right.
      See the decision-log entry below for the actual CSS cascade bug
      that caused that.
- [x] **Settings focus preservation (2026-11-12, v1.0.11):** "Selecting
      any setting jumps focus to the top of the panel." Root cause:
      `settingsDrawer.js`'s `render()` destroys and rebuilds its entire
      DOM on every single interaction, orphaning whatever element
      `navigation.js` had focused - the next D-pad press couldn't find it
      in the fresh DOM and fell back to focusing the first element in
      scope (`navigation.js`'s own `moveFocus()` fallback behavior,
      working as designed for a case this app hadn't hit before: a
      re-render destroying the tracked element). Fixed with two new
      exports in `navigation.js` (`getFocusIndexWithin`/
      `focusIndexWithin` - capture/restore focus by position, not
      identity, since every render()-triggering control here preserves
      element count/ordering before the clicked one) wrapped around
      `settingsDrawer.js`'s single `render()` function, which every
      control recursively calls - one fix point, not one per control.
      Verified live with real dispatched keydown events (not `.click()`,
      which bypasses `navigation.js` and wouldn't exercise the actual
      bug) across 3 interaction types: city select, group-header
      expand/collapse, pinned-app toggle. Full writeup, including a false
      alarm during verification traced to stale state from a real
      multi-minute conversation gap (not a real bug), in docs/handoff.md.
- [x] **Dashboard wallpaper "blank" fix (2026-11-12, v1.0.12):** "Layout
      switch sometimes leaves a blank background; theme switch doesn't."
      Both actions run the exact same `onChange` handler/wallpaper code
      path, so investigated live before assuming a mechanism difference:
      150-switch stress test (no crashes), all 63 pool entries got
      picked and correctly applied, all 58 real photo URLs load
      successfully in under 50ms each (even the 3.2MB one, ruling out
      slow-decode-on-weak-hardware), a clean single switch showed a
      proper overlapping crossfade with no gap. Real cause: 5 built-in
      dark CSS gradients in the pool read as "no wallpaper" against this
      app's dark theme when picked (~8% chance per pick, identical odds
      regardless of which action triggered the pick - pure chance which
      one you'd notice it on first). Per your choice, `getAllWallpapers()`
      now excludes the gradients from the dashboard whenever real photos
      exist, falling back to them only for a genuinely empty wallpaper
      folder. Verified live: 0/100 gradient picks post-fix across both
      layout and theme switches (was ~8/100 expected). Also chased down
      and ruled out a red herring (an apparent stale-asset accumulation
      on the TV, 127 files vs ~62 source) as a one-off bad measurement,
      not a real `dev/install` bug - confirmed clean (61 files) on
      recheck after the next install.
- [x] **Elevated listLaunchPoints fallback (2026-11-12, v1.0.13):** Asked
      to try fixing the Input Source dropdown. The direct
      `listLaunchPoints` denial can't be removed, but found and verified
      live (before writing code) that Homebrew Channel's own `exec`
      service - already installed, since this is a rooted TV - runs
      arbitrary shell commands as root, and that our app's own identity
      (not just root SSH) can reach it. Used it for a fixed, hardcoded
      proxy call (`exec` -> `script`-wrapped `luna-send` ->
      `listLaunchPoints`, same pty-needed reason documented elsewhere) -
      no injection surface, no new network-facing attack surface (purely
      an internal Luna Bus call between two already-installed local
      apps). Real cost handled rather than glossed over: ~3.2s measured
      round trip, which would have silently added that to every boot on
      this TV (icon discovery already blocked first paint) - added a
      boot loader per your explicit ask, after flagging the tradeoff and
      getting your call to accept it. Also found and fixed a real bug
      this exposes: stored pin keys (this app's own catalog keys) don't
      match discovered apps' real ids for most of the catalog, which
      would have silently unpinned most of your home screen the moment
      discovery started working - fixed on both the dashboard and
      Settings' toggle (read AND write sides - the write side needed the
      same bridge or a toggle-off wouldn't have actually unpinned
      anything). Honestly flagged going in, not left to be discovered:
      this TV's actual launch points (captured earlier this session) have
      zero HDMI/input-pattern matches, so Input Source will likely still
      show empty - a different, deeper limitation than the permission
      issue this fix actually solves.
- [x] **Icon fallback fix (2026-11-12, v1.0.14):** Reported right after
      testing v1.0.13 (first time discovered apps' real icon URLs were
      ever actually exercised on-device): broken icons, tile names shown
      twice. Diagnosed live, confirmed step by step rather than guessed:
      every tile's `<img>` had `complete:true, naturalWidth:0` (a real
      failed decode) with no glyph ever swapped in; checked
      `Element.prototype.replaceWith` (what the swap used) and confirmed
      it's `undefined` on this engine (landed Chrome 54, one version
      after this TV's real Chrome 53 - `.remove()` from the same
      ChildNode mixin exists, the later-landing trio
      `before`/`after`/`replaceWith` doesn't); separately confirmed via
      SSH that the real icon files genuinely exist with real content at
      the exact paths returned, ruling out a bad-path/corrupt-file
      explanation - the actual block is this app's web view being unable
      to load `file://` images from other apps' directories, a platform
      sandboxing boundary distinct from the Luna ACL denial already
      worked around for `listLaunchPoints` itself. Fixed with a new
      `core/dom.js` helper (`replaceEl`, built on the universally-
      supported `parentNode.replaceChild`) replacing both
      `el.replaceWith(...)` call sites (`appTile.js`, `settingsDrawer.js`
      - same bug, same fix, in two places). Verified the swap mechanism
      itself live before building the real fix, then verified the
      shipped fix the same way: all 10 live tiles now show
      `hasGlyph:true, hasImg:false`, no duplicate text.
- [x] **Input Source removed + opacity restored (2026-11-12, v1.0.15):**
      Removed the Input Source dropdown entirely - confirmed not
      functional on this TV (zero HDMI-pattern matches in its real
      launch points, found earlier this session), asked to drop it
      rather than leave it broken. Deleted `components/inputSwitcher.js`
      + `data/inputs.js` outright, unwound `main.js`'s wiring and
      `statusbar.js`'s slot, removed the dead `.input-switcher*` CSS.
      Separately: "opacity of app tiles & hero panels has gone" -
      checked live first and confirmed nothing had regressed (`.app-tile`
      was still exactly `rgba(18,20,26,0.88)`, unchanged;
      `.bento__hero-backdrop` was correctly `0.45` as set earlier) - this
      was new ground (tiles/`.bento__hero` itself were never included in
      the earlier "see through the wallpaper" round, only the backdrop
      layer was), not a bug. Gave both their own `rgba(18,20,26,0.45)`
      background, winning over `.glass-panel`'s default via source
      order. Verified live. Also addressed, not dismissed: the user's
      own hypothesis that the new same-glyph-for-every-discovered-app
      situation might be causing this - confirmed it isn't (`color`/
      `currentColor` for the glyph tint and `background-color` for the
      tile's own fill are unrelated CSS properties).
- [x] **Minimal Dock opacity compounding fixed (2026-11-12, v1.0.16):**
      v1.0.15's opacity fix missed one spot - Minimal Dock's tiles sit
      inside `.minimal-dock__dock`, itself `.glass-panel` and still at
      the default 0.88 opacity, so even with the tile's own 0.45 the two
      dark layers stacked and read as fully opaque. Confirmed live
      before fixing (both backgrounds read simultaneously). Gave the
      dock the same `rgba(18,20,26,0.45)`.

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
- **2026-11-12 (real TV deploy):** App id chosen as `com.tvdashboard.home`
  — a generic, non-personal reverse-domain id (not tied to any real
  domain or name) since this is a personal sideloaded app, not a Store
  submission; easy to rename later since it's just a string, nothing
  external depends on it.
- **2026-11-12 (real TV deploy):** Installed via the Homebrew Channel
  README's own documented manual path (`luna-send-pub
  luna://com.webos.appInstallService/dev/install` with a local `ipkUrl`,
  over root SSH), not `ares-install`, because this TV's devmode SSH
  session (port 9922) would not stay listening no matter what was tried —
  Dev Mode Status toggle, Key Server toggle, a full TV reboot, re-running
  `ares-novacom --getkey`. All diagnosed live (via root SSH: `netstat`,
  `pgrep`, checking `/proc/net/tcp` for the actual bound port) rather than
  guessed, confirming the devmode *service process* was running but never
  actually bound to 9922. If this starts working again later,
  `ares-install` is equally fine to use — same net installed result, nothing
  about the app depends on which path installed it.
- **2026-11-12 (real TV deploy):** Discovered and worked around a real
  `luna-send`/`luna-send-pub` quirk on this firmware: it only flushes
  output when attached to a pty. A plain non-interactive `ssh host "cmd"`
  (what any scripted/automated install needs) gets zero bytes back with
  exit code 0 — not an error, just silently empty — unless the remote
  command is wrapped in `script -qc "..." /dev/null` to fake a pty. Cost
  significant debugging time before being isolated (confirmed first with
  a trivial `echo` over the same channel working fine, ruling out SSH
  quoting, then confirming `script` fixed it). Worth remembering for *any*
  future scripted `luna-send` use in this repo, not just installs.
- **2026-11-12 (real TV deploy):** 6 wallpaper filenames (across
  `comic/` and `motivational/`) contained non-ASCII characters — an
  ellipsis, an em dash, a curly apostrophe, and two emoji — which made
  `ares-package` hard-fail ("Please use the file name in english
  letters"). Renamed in place (e.g. dropping the emoji/ellipsis, em dash
  → hyphen, curly quote → straight apostrophe) rather than excluding them
  from the build, since they're real images the user wants in the
  shuffle; `core/wallpapers.js`'s auto-discovery needed no code change
  since it globs the folder contents, not a hardcoded list.
- **2026-11-12 (webOS bridge fix):** Chose a hand-written shim over
  installing the `webostvjs` npm package when the app only uses one
  narrow call shape (`window.webOS.service.request(uri, {method,
  parameters, onSuccess, onFailure})`, in exactly 2 files) — matches this
  project's existing pattern of self-authoring over pulling in a library
  for a small, well-understood surface (same reasoning as the hand-drawn
  SVG icon set over an icon-font CDN). `webostvjs` is also an unofficial
  third-party mirror (maintainer `hcodes`, not LG), not LG's own
  distribution, which was a secondary factor. An `npm install` for it was
  in fact blocked by the harness's own permission classifier
  ("Undermining Oversight" — installing a new third-party dependency
  without the user's say is exactly the kind of decision that should
  route through them), which forced this to be an explicit
  user-confirmed choice rather than a silent one anyway.
- **2026-11-12 (webOS bridge fix):** `requiredACG` in appinfo.json was
  tried (`["application.launcher", "application.query"]`, the one group
  LG's own ACG guide documents for `applicationManager`'s `launch`
  method — `listLaunchPoints` isn't documented anywhere in that guide)
  and made no measurable difference to the `listLaunchPoints` denial.
  Left declared anyway since it's harmless, matches the documented format
  for when this TV's firmware (or a future one) does start honoring it,
  and already silences `ares-package`'s own warning about the field being
  unset. Not worth removing.
- **2026-11-12 (on-TV feedback round 1):** App tile label moved from
  "pushed below the tile" (`bottom: -32px`, needed external vertical room
  in every layout's grid/row spacing) to "overlaid on the tile's own
  bottom edge" (`bottom: 0` + a dark gradient behind the text) when making
  it always-visible - the overlay approach needed zero changes to any
  layout's row/grid spacing math across all 3 layouts, where reserving
  extra space below each tile would have needed separate, different fixes
  per layout (Apple TV's row, Bento's wrapped grid, Minimal Dock's
  bottom-pinned pill-shaped dock).
- **2026-11-12 (on-TV feedback round 1):** New apps added to the catalog
  (ZEE5, SonyLIV, JioCinema, Voot, Amazon Alexa, LG Content Store, Photo &
  Video, Music, Home Dashboard, Pac-Man, Homebrew Channel, Developer
  Mode) are deliberately NOT added to `settings.js`'s default
  `pinnedApps` - only made available via Settings → Pinned Apps. Keeps the
  curated 7-app starter dashboard from being diluted with apps not
  everyone wants there by default (dev/root tools especially); the user
  picks what actually goes on their home screen.
- **2026-11-12 (on-TV feedback round 1):** Plex's catalog entry and
  default pin were left alone despite being in the exact same situation
  as the removed Spotify entry (not actually installed on this TV, per
  the full `listLaunchPoints` dump) - only Spotify's removal was
  explicitly requested. Don't conflate "same technical situation" with
  "same user intent" - ask rather than extrapolate when a request names
  one specific thing among several that look alike.
- **2026-11-12 (on-TV feedback round 2):** When asked to "increase the
  font and icon size" for just Minimal Dock, actually testing that fix
  live surfaced a bug affecting all 3 layouts (percentage-height icons).
  Fixed all 3, not just the one asked about - a genuine bug found while
  doing requested work is worth fixing immediately while already in that
  code with device access to verify it, not filed away for later. This is
  different from the Plex-vs-Spotify situation above: that was a scope
  question about user *intent* (which apps to remove) with no technically
  correct default; this was a discovered defect with only one correct
  answer (broken rendering) once found, not a judgment call to extrapolate.
- **2026-11-12 (on-TV feedback round 2):** Diagnosed both the "flicker"
  report and the navigation bug by checking the live device first
  (MutationObserver, direct `scrollIntoView` behavior tests, dispatched
  real keydown events) rather than reasoning from source code alone or
  guessing likely causes. The source-only read for the flicker report
  would have pointed at several plausible candidates (lightning-flash
  weather effect, OLED pixel-shift, wallpaper crossfade); live inspection
  immediately ruled those out and pointed at the actual cause. Worth
  repeating as the default approach now that real TV/DevTools access
  exists - it directly settles "which of these plausible theories is
  actually true" rather than fixing the most-plausible-sounding guess and
  hoping.
- **2026-11-12 (on-TV feedback round 2):** `launch`-ing an already-running
  webOS app (`applicationManager/launch` on this app's own id, used
  throughout this session to bring the dashboard back to foreground after
  switching away to test something) does NOT reset its JS state - closure
  variables like the hero carousel's `active` index persisted across
  several `launch` calls in a row. Only a real reinstall (`dev/install`)
  or an explicit app-closing event actually restarts the JS context. This
  matters for any future on-device timing verification: elapsed wall-clock
  time since the last `launch` call is not a reliable proxy for "time
  since this JS actually started running" - check the deployed bundle's
  source directly instead when verifying an interval/timing change.
- **2026-11-12 (always-on animations fix):** `animation-play-state:
  paused` as its own separate rule, set earlier in a stylesheet than the
  `animation: ...` shorthand that actually defines the animation, loses
  to that shorthand even at equal selector specificity - the shorthand
  resets ALL of its sub-properties (including `animation-play-state`) to
  their defaults wherever it's declared, and CSS cascade only falls back
  to source order when specificity is exactly equal, which it was here.
  Lesson: a `play-state`/similar sub-property override must either live
  inside the same rule as the shorthand, after it in that rule, or come
  from a genuinely higher-specificity selector - a same-specificity rule
  "above" the shorthand in the file is not safe to assume wins. Caught
  only by re-verifying `animationPlayState` on-device after deploying,
  not by the CSS merely looking correct on review - the general pattern
  this session has repeatedly validated: verify claims about this engine
  live, don't trust that correct-looking CSS/JS behaves as expected on
  it.
- **2026-11-12 (always-on animations fix):** Framed the fix to the user
  honestly as "found and fixed a real, verified waste" rather than
  claiming it definitely solves "slow navigation" - this environment has
  no way to simulate an actual physical remote button press through
  webOS's real input pipeline (only synthetic `dispatchEvent` calls,
  which bypass that pipeline entirely and only measure this app's own JS
  execution time). Don't overclaim diagnosis certainty when a real
  external factor genuinely can't be tested from here; ask the user to
  confirm the actual felt result instead.
- **2026-11-12 (settings focus preservation):** Chose capture/restore-by-
  index over giving every settings control a stable identity key to match
  across re-renders - index-based is simpler and is provably correct for
  every actual render()-triggering interaction in this specific file
  (verified by reasoning through each one: none of them insert/remove
  elements *before* the position of the one just interacted with). A
  stable-key approach would be more robust in general but is unneeded
  complexity here; revisit only if a future control is added that *can*
  change earlier positions on its own click (none currently do).
- **2026-11-12 (settings focus preservation):** Verified this fix with
  real dispatched keydown events, not direct `.click()` calls on target
  elements - `.click()` fires the onclick handler directly without going
  through `navigation.js`'s `moveFocus`/`currentEl` tracking at all, so it
  would never have exercised the actual bug (which only manifests via
  the focus-tracking path a real remote press uses). Matters for any
  future navigation-related verification in this app: always drive it
  through dispatched key events, not direct DOM method calls on the
  target.
- **2026-11-12 (dashboard wallpaper fix):** Chose `customWallpapers.length
  > 0` as the guard for excluding gradients from the dashboard, not a
  flat unconditional exclusion - an unconditional version was tried first
  and caught before deploying: it would have made a genuinely-empty
  `src/assets/wallpapers/` folder show a truly blank dashboard
  (`wallpaperStack.js`'s `start()` bails out early on an empty pool,
  before `pickRandom()`'s own `DEFAULT_WALLPAPERS[0]` fallback ever gets
  a chance to run), which directly contradicts the whole reason
  `DEFAULT_WALLPAPERS` exists. The guard preserves that original
  zero-dependency-fallback intent while fixing the actual reported
  problem for the common case (real wallpapers already added).
- **2026-11-12 (dashboard wallpaper fix):** Investigated by testing the
  *shared* mechanism (image loads, crossfade timing, pool coverage) live
  before assuming the two reported-different actions (layout vs theme
  switch) must have different code paths - they don't, confirmed by
  reading `main.js`'s single `onChange` handler first. Saved significant
  time over chasing a layout-vs-theme difference that doesn't exist in
  the code.
- **2026-11-12 (elevated listLaunchPoints):** Verified the hbchannel
  `exec` capability live, in layers, before writing any production code -
  first that root SSH could use it at all (expected), then specifically
  that *our app's own identity* could reach it (the real open question,
  confirmed via `window.webOS.service.request` from the running app's
  own console, not assumed from the SSH result), then that it actually
  ran as root (`id` -> uid=0), then the full real chain end-to-end. Each
  step answered a different question; skipping to the full chain first
  would have left "does our app's identity even have access" unverified
  if it had failed for an unrelated reason.
- **2026-11-12 (elevated listLaunchPoints):** Didn't just implement the
  boot-loader ask mechanically - measured the actual delay first (~3.2s),
  explained why it existed (icon resolution already blocked first paint;
  this TV's direct call always fails so the elevated path always
  fires), and got an explicit choice between accepting it vs. a
  bigger background-resolve restructure before writing either. The user
  picked the simple blocking version with a loader - didn't second-guess
  that into the "more correct" background-resolve version unasked.
- **2026-11-12 (elevated listLaunchPoints):** Fixed the pinned-apps
  key-matching bug (static catalog keys vs. real discovered ids) as part
  of this same change, without being asked separately - same reasoning
  as the earlier icon-sizing bug found during the Minimal Dock request:
  a defect with only one correct answer once found (most pins would
  silently vanish) is worth fixing immediately while already in the
  exact code path with full context, not filed away for later.
- **2026-11-12 (icon fallback fix):** Added `core/dom.js`'s `replaceEl()`
  as a shared helper rather than inlining `parentNode.replaceChild` at
  each of the two call sites - the SAME ChildNode-API-missing-on-this-
  engine class of bug already bit this project once (`navigation.js`'s
  `scrollIntoView` options form earlier this session); a single, clearly-
  commented helper makes the "this engine lacks modern DOM convenience
  methods, verify before using one" lesson discoverable at the point of
  use for whoever reaches for `.replaceWith`/`.before`/`.after` next,
  instead of relying on remembering a session-only lesson.
- **2026-11-12 (icon fallback fix):** Deliberately did NOT attempt to
  make real cross-app icons actually load (e.g. piping icon bytes through
  the elevated exec path as a `data:` URI) - confirmed the file-access
  sandboxing boundary is real but that wasn't what broke; the reported
  bug was the broken-image-to-glyph fallback failing, which is now fixed
  and restores the app's already-intended degraded behavior. Don't
  expand a bug-fix's scope to "and also solve the harder adjacent
  problem" without being asked, even when the harder problem is
  interesting and partially understood.
