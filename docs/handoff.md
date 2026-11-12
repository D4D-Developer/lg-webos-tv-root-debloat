# Handoff — Custom TV launcher ("Homepage Dashboard")

## What this is
A single-page, 10-foot TV home-screen UI for the rooted LG webOS 4.x TV
(Phase 3 of this repo, previously parked in docs/03-ui-ux-notes.md): 4 glass
themes, 3 switchable layouts, live weather/AQI/latency/memory status pill +
weather effects, D-pad spatial navigation, a grouped Settings drawer,
wallpaper/screensaver shuffle, Plex/TMDB hero content, real webOS icon +
installed-app discovery, and OLED care features.

This file tracks only the CURRENT state and open items. The full
session-by-session history (every round's specific changes, bugs found,
and reasoning) lives permanently in docs/progress.md's "Completed" list and
"Architectural Decisions" section - read that for "why does X work this
way," not this file.

## Status

- [x] **Deployed and running on the real TV** (app id `com.tvdashboard.home`,
      **v1.0.16**). Confirmed via live DevTools inspection (not guessed): real
      engine is Chrome 53.0.2785.34 on Web0S/Linux, exactly matching the
      legacy-build assumption. App renders correctly. `launch` Luna calls
      work, verified by actually launching Netflix from the dashboard.
      `listLaunchPoints` directly (as any ordinary app) is still
      permission-denied on this firmware, but v1.0.13 adds a working
      elevated fallback through Homebrew Channel's own root-level `exec`
      service - see "Elevated listLaunchPoints fallback" below. The
      **"Known limitation" section further down is now partially
      outdated** (icon resolution and Pinned Apps discovery should
      actually work now).
- [x] **v1.0.14: broken-icon / doubled-name tiles fixed.** You caught
      this right after testing v1.0.13 - real cause confirmed live:
      `Element.prototype.replaceWith` (used to swap a broken `<img>` for
      the glyph fallback) doesn't exist on this engine at all (landed
      Chrome 54, one version after this TV's real Chrome 53), so that
      swap was silently throwing and leaving the broken image - with its
      `alt` text, which duplicated the tile's own always-visible label -
      on screen instead. Also confirmed, separately, that the discovered
      apps' real icon *files* genuinely exist with real content on disk
      (checked via SSH) but this app's web view can't load them across
      app directories - a platform sandboxing boundary, not a bug we can
      route around the same way as the listLaunchPoints denial. Fixed
      the swap with `core/dom.js`'s new `replaceEl()`
      (`parentNode.replaceChild`, universally supported) - verified live:
      every tile now correctly shows its glyph with no broken image and
      no duplicate text. See "Icon fallback fix" below.
- [x] **v1.0.15: Input Source button removed; app tile/hero panel
      opacity restored.** Input Source dropped entirely (header, status
      bar wiring, `components/inputSwitcher.js` + `data/inputs.js` both
      deleted, their CSS removed) - confirmed not functional on this TV
      (see "Elevated listLaunchPoints fallback" above: zero HDMI-pattern
      matches in this TV's real launch points) and you asked for it gone
      rather than left broken. Separately, app tiles and the Bento hero
      panel now show the dashboard wallpaper through them again - both
      were still at their original 0.88-opacity glass-panel background
      even after the earlier "see through the wallpaper" round only
      touched `.bento__hero-backdrop`, not `.app-tile` or `.bento__hero`
      itself. See "Opacity restored" below for how this was narrowed down
      (confirmed live first that nothing had actually regressed - this
      was new ground, not broken ground).
- [x] **v1.0.16: Minimal Dock tiles fully opaque, fixed.** The v1.0.15
      opacity fix covered `.app-tile` and `.bento__hero`, but Minimal
      Dock's tiles sit *inside* `.minimal-dock__dock`, itself a
      `.glass-panel` still at the original 0.88 opacity - two dark
      semi-transparent layers (dock 0.88, tile 0.45) stacked and read as
      fully opaque. Confirmed live before fixing (`dockBackground:
      rgba(18,20,26,0.88)`, `tileBackground: rgba(18,20,26,0.45)`
      simultaneously). Gave `.minimal-dock__dock` the same
      `rgba(18,20,26,0.45)` background. Verified live: both dock and
      tile now report the same `0.45` value.
- [x] **v1.0.12: "blank" dashboard wallpaper fixed.** Not a real failure -
      ruled out image load errors and crashes via extensive live testing
      (150-switch stress test, all 58 real photos load successfully,
      every pool entry gets picked correctly) - the actual cause was 5
      dark generated gradients in the wallpaper pool that read as "no
      wallpaper" against this app's dark theme, picked ~8% of the time by
      pure chance on *either* a layout or theme switch (same code path,
      no real mechanism difference between the two - just random luck of
      which one you'd hit it on first). Per your choice, gradients are
      now excluded from the dashboard rotation whenever real photos
      exist - verified live: 0 gradient picks across 100 combined
      layout/theme switches, down from the expected ~8/100. See
      "Dashboard wallpaper fix" below for the full investigation.
- [x] **v1.0.11: Settings focus-preservation fix.** Selecting anything in
      Settings (a city, a toggle, a theme, expanding a group...) was
      jumping focus back to the very top of the drawer instead of staying
      where you were - real cause: `settingsDrawer.js` fully destroys and
      rebuilds its entire DOM on every single interaction, which orphaned
      whatever element `navigation.js` had focused, so the next D-pad
      press couldn't find it and fell back to the first element in scope.
      Fixed by capturing/restoring focus position across each rebuild.
      See "Settings focus preservation" below for the full writeup.
- [x] **v1.0.9/1.0.10: fixed 45 always-on background animations** (24 rain
      drops + 18 snowflakes + fog + lightning + all 3 hero Ken Burns
      backdrops) that were running continuously regardless of visibility -
      confirmed live via `animationPlayState`, in response to a "remote
      navigation feels slow" report. See "Performance: always-on
      animations" below for the full writeup, including a real mistake
      made and caught mid-fix (a same-specificity CSS rule losing to the
      `animation` shorthand's own implicit play-state, discovered by
      re-verifying on-device rather than assuming the first attempt
      worked).
- [x] **First real on-TV feedback round, all 4 addressed** (v1.0.3 → v1.0.4):
      header font/settings-icon size, wallpaper rotation (real root cause:
      EXIF orientation this TV's Chrome 53 doesn't honor), Netflix not
      launching (real appId was null), and tile labels only showing on
      focus (now always visible - see "On-TV feedback round 1" below for
      the full writeup).
- [x] **Second on-TV feedback round, all 3 addressed** (v1.0.4 → v1.0.6):
      hero carousel rotating every 9s reported as "screen flicker" (slowed
      to 25s), Minimal Dock icons/labels too small (bigger now, and a real
      engine bug this exposed), remote navigation broken inside Settings
      (a real engine incompatibility, not a logic bug) - see "On-TV
      feedback round 2" below for the full writeup, this is the more
      technically significant of the two rounds so far.
- [ ] LG Input Hook (Home-button remap) - explicitly deferred, your call,
      see "Deferred" below.

## Where things stand
- Dev server: `cd launcher && npm run dev` -> http://localhost:5173/.
- TV device: registered in `ares-setup-device` as `mytv`. Root SSH (port 22,
  Homebrew's dropbear) is the reliable path - `ares-install`'s devmode SSH
  (port 9922) kept dying after boot/wake despite "Dev Mode Status: ON" in
  the Developer Mode app; toggling Key Server + a full reboot didn't fix it
  either. Installs went through instead via the officially-documented
  manual path from the Homebrew Channel README: copy the `.ipk` to `/tmp`
  over root SSH, then `luna-send-pub -i -f -w 30000
  'luna://com.webos.appInstallService/dev/install'
  '{"id":"<appId>","ipkUrl":"/tmp/<file>.ipk","subscribe":true}'` run
  **through `script -qc "..." /dev/null`** - `luna-send`/`luna-send-pub`
  only flush output when attached to a pty, which a plain non-interactive
  `ssh host "cmd"` doesn't provide; without the `script` wrapper every call
  silently returns zero bytes with exit 0, which cost a lot of the
  debugging time this round. If `ares-install` ever starts working again
  (devmode session comes back to life), that's still fine to use instead -
  same net effect.
- Build -> package -> install loop, all verified working end to end:
  `cd launcher && npm run build && ares-package dist -o .` produces
  `com.tvdashboard.home_<version>_all.ipk` (appinfo.json + icon.png +
  largeIcon.png live in `launcher/public/`, copied into `dist/` by Vite
  automatically), then scp + the `dev/install` call above.
- The TV's own remote DevTools inspector is reachable directly from a
  computer on the LAN at `http://<tv-ip>:9998/json` (no SSH needed) -
  lists inspectable pages/workers with a `webSocketDebuggerUrl`. Useful for
  future UI verification without needing eyes on the physical screen.

## Known limitation (real, verified, not a bug in our code)
`window.webOS.service.request(...)` calling
`com.webos.applicationManager/listLaunchPoints` is **denied** on this
TV/firmware for a devmode-sideloaded web app -
`{"returnValue":false,"errorCode":-1,"errorText":"Denied method call
\"listLaunchPoints\" for category \"/\""}`. Confirmed with
`requiredACG: ["application.launcher","application.query"]` declared in
appinfo.json too - made no difference (LG's ACG guide itself says ACG
enforcement doesn't apply below webOS TV 25, which lines up: this error
is almost certainly the older, pre-ACG Luna Bus category/role-file
permission system, not the modern appinfo.json field). `launch` by app id,
by contrast, **is allowed** and was verified working (briefly launched a
real system app during testing, then launched back to our own app) - so
the actually-important capability (tapping a pinned tile to open an app)
works. What doesn't work live, on-device, from inside the app's own JS:

- Icon resolution (`core/icons.js`) - falls back to the hand-drawn SVG
  glyphs, by design. No change needed, this is already the intended
  fallback behavior, just now confirmed to be the *permanent* path on this
  TV rather than a temporary "untested" state.
- Pinned Apps' live installed-app list (`data/apps.js`'s
  `getPinnableApps()`) - falls back to the static demo catalog. Real
  appIds for pinning now have to come from the SSH-based lookup
  (`luna-send -n 1 -f luna://com.webos.applicationManager/listLaunchPoints
  '{}'` run **over SSH directly**, which has full privileged access,
  wrapped in `script -qc "..." /dev/null` per the pty note above) and be
  hand-filled into `APPS` in `data/apps.js`, same as platform.js's
  original comment always anticipated as the fallback workflow - just now
  confirmed to be the *only* working workflow, not an optional one.
- Input source discovery (`data/inputs.js`) - stays in its honest "No
  inputs detected on this TV yet" state. Same root cause.

None of this needed a code fix - the app's existing fallback design
already assumed exactly this kind of restriction might exist on real
hardware, so it degrades the way it was meant to. If reducing this
limitation ever matters (e.g. so the shuffled wallpaper + real app icons
+ live pinning all light up), the next thing worth trying would be
proxying `listLaunchPoints` through something already running with
root/system Luna Bus access (Homebrew Channel's own service, or a tiny
custom root-level helper) rather than calling it directly from the app's
own restricted identity - not attempted this round, flagging as a
possible future angle only.

## Real fix made this session (not just a deployment step)
`window.webOS` **did not exist** on the real device page at all until this
session - LG's `webOSTV.js` helper library (the thing that normally
defines it) was never included, so every Luna call in the app would have
silently fallen through to the dev/off-device fallback path even when
genuinely running on the TV. Added `launcher/src/core/webosBridge.js`: a
~30-line hand-written shim (not an installed dependency - see
progress.md's decision log for why) that defines
`window.webOS.service.request(...)` directly on top of webOS's natively-
injected `PalmServiceBridge`, matching the one call shape the rest of the
app already uses. Imported first in `main.js`. Verified via live DevTools
eval: `window.webOS` is `true` post-fix (`false` before), and a real
`launch` call round-tripped successfully through it.

## On-TV feedback round 1 (v1.0.3 → v1.0.4)
Four issues reported after actually using the app on the TV for the first
time - all real, all fixed:

1. **Header font/settings icon too small** - `statusbar.css`: greeting
   22→26px, pill text 20→23px, clock time/date 20/15→24/18px, settings
   icon button 48→56px and its glyph 22→28px.
2. **Wallpapers rotated wrong on TV but correct in Finder** - real cause
   found, not guessed: 22 images (`comic/`, `cars/`) carry an EXIF
   `Orientation` tag (6 or 8 - a 90° rotation) that Finder/Preview/modern
   browsers auto-apply for display, but Chrome didn't start doing that by
   default until well after this TV's Chrome 53 (2016) engine - it just
   shows the raw unrotated pixels. Fixed with `magick <file> -auto-orient
   <file>` on all 22 in place, which bakes the rotation into the actual
   pixel data and resets the tag to 1 (normal) - works regardless of
   whether the viewer honors EXIF at all. Re-scanned afterward to confirm
   zero remaining non-1 orientations.
3. **Netflix wouldn't open** - its `appId` was still the `null` placeholder.
   Fixed as part of the broader app-catalog work below.
4. **Tiles only showed their name on focus, not recognizable otherwise** -
   real cause: `.app-tile__label` was `opacity: 0` by default,
   `opacity: 1` only `.app-tile.is-focused` (`layouts.css`), AND the Bento
   and Minimal Dock layouts were explicitly passing `{ showLabel: false }`
   to `appTile()` so the label element didn't even exist there
   (`bentoLayout.js`, `minimalDockLayout.js`). This was a fine design
   choice when real per-app webOS icons were expected to resolve and make
   tiles individually recognizable - now that icon discovery is
   permanently blocked on this TV (see "Known limitation" above) and many
   apps share one of a handful of generic hand-drawn glyphs, unfocused
   tiles were genuinely indistinguishable. Labels are now always visible
   on all 3 layouts, as an overlay band anchored to the tile's own bottom
   edge (`bottom: 0` + a dark gradient behind the text for legibility)
   rather than pushed below the tile (`bottom: -32px` previously) - that
   was a deliberate choice so no layout's row/grid spacing needed
   reworking to avoid overlap; Minimal Dock's small 84px tiles get a
   scaled-down 11px/tighter-padding version of the same band. Verified
   live on-device via DevTools: all 7 default-pinned tiles' labels read
   `opacity: 1`.

Also, per your explicit requests in the same round:

- **Removed Spotify** from the app catalog entirely (`data/apps.js`) and
  from the default pinned set (`core/settings.js`) - it was never actually
  installed on this TV (absent from the full `listLaunchPoints` dump), so
  its tile was always a dead end. Plex is in the same boat (not installed
  either) but you only asked about Spotify, so Plex's catalog entry and
  default pin are untouched - say the word if you want that gone too.
- **Added the TV's full real installed-app list** to the catalog (12 new
  entries: ZEE5, SonyLIV, JioCinema, Voot, Amazon Alexa, LG Content Store,
  Photo & Video, (webOS) Music, Home Dashboard, Pac-Man, Homebrew Channel,
  Developer Mode), all via the same SSH `listLaunchPoints` lookup, real
  ids, nothing guessed. None of these are auto-pinned to the home screen
  by default - deliberately, so Developer Mode/Homebrew Channel/Pac-Man
  etc. don't clutter the curated starter dashboard - they're available to
  pin from Settings → Pinned Apps instead. Verified live on-device: all 19
  catalog apps (7 default-pinned + 12 new) appear correctly in that list.
  Added 6 new hand-drawn glyphs for these (`mic`, `grid`, `image`, `home`,
  `gamepad`, `terminal`) in the same self-authored line-icon style as the
  existing set - see progress.md's icon-glyph decision for why
  self-authored, not brand logos.

## On-TV feedback round 2 (v1.0.4 → v1.0.6)
Three issues, all real, all root-caused by actually checking the live
device via DevTools rather than guessing from source alone:

1. **"Screen flickers very frequently without any inputs"** - real cause:
   `appleTvLayout.js`'s Hero Content carousel (`HERO_ROTATE_MS`) was
   rotating every **9 seconds**, and with real Plex/TMDB content off by
   default (`useRealHeroContent: false`), only 3 demo slides exist - so
   the entire hero area was cycling completely every 27 seconds, forever,
   with no user input. Confirmed via a MutationObserver installed live on
   the TV's page (27 DOM mutations in a 12s window, all under
   `hero__backdrop`/`hero__content`/`hero__dots`) before touching any
   code - not a theory. Slowed to 25s (`HERO_ROTATE_MS = 25000`).
2. **Minimal Dock icons/labels too small** - sizes bumped (tile 84→112px,
   label 11→14px) same as before, but this surfaced something much bigger:
3. **A real engine bug, not a code bug - percentage HEIGHT silently fails
   on nested flex items on this TV's Chrome 53.** While verifying the
   Minimal Dock icon fix live, an icon set to `width: 52%; height: 52%`
   of its 112px tile rendered as ~51×**108**px instead of ~58×58px - width
   resolved correctly, height came back nearly the tile's full height.
   Checked the *other* two layouts too (not asked, but the same
   `.app-tile__icon-glyph { width: 40%; height: 40% }` pattern was used
   everywhere) - Apple TV's icon was rendering 106×**154**px on a 280×158
   tile instead of ~112×63px. **This had been silently broken in every
   layout since the icon-glyph system was built**, never caught because
   local/desktop-browser testing (where percentage height works fine) was
   the only testing possible before this project had TV access. Confirmed
   fixed-px resolves correctly instead (live-tested: `58px`/`58px` set
   directly came back as exactly `58`/`58`), so every layout's icon sizing
   is now fixed px instead of %, computed per that layout's actual fixed
   tile size (`layouts.css`): Apple TV 112×63 (glyph) and 134×76 (img),
   Bento 88×88 (glyph) and 106×106 (img), Minimal Dock 62×62 (both).
   Verified all three post-fix via DevTools, exact pixel match for each.
4. **Settings panel remote navigation "broken"** - real cause, also a
   genuine engine incompatibility, also confirmed live rather than
   assumed: `navigation.js`'s `focus()` called
   `el.scrollIntoView({ block: "nearest", inline: "nearest" })` - the
   options-object form of `scrollIntoView`, which postdates this TV's
   Chrome 53 engine (landed around Chrome 61+). Passing an object there
   doesn't throw on old engines, so the pre-existing try/catch around it
   never caught anything - it silently gets coerced into the legacy
   boolean API instead, which unconditionally aligns the focused
   element's top/left edge to its scroll container's, even when already
   fully visible. Proved this live: an already-on-screen settings row
   forced the drawer's `scrollTop` to jump from 50 to 757. This bug
   predates this session, but was easy to miss when the settings drawer's
   content was short enough that the forced "jump to top" rarely had
   anywhere to actually jump to - it became constantly, obviously
   disruptive only once the Pinned Apps list grew to 19 real apps (this
   session's earlier change) and made the drawer tall enough to really
   need scrolling. Replaced with a hand-written `scrollIntoViewNearest()`
   using only `getBoundingClientRect()`/`scrollTop`/`scrollLeft` - APIs
   this engine has always had - that computes the true minimum scroll
   needed, covering both the settings drawer's vertical scroll and the
   Apple TV app row's horizontal scroll (same underlying issue, less
   visible there with only ~7 pinned apps by default). Verified via real
   dispatched `ArrowDown`/`ArrowUp` keydown events live on-device:
   navigating to an already-visible row now produces `scrollTop` delta of
   exactly `0` (was a ~700px jump before), and scrolling through the full
   19-item list shows smooth incremental `scrollTop` progression.

## Performance: always-on animations (v1.0.9 → v1.0.10)
Asked "why is remote navigation so slow, can you fix it." Measured first
rather than guessed: dispatched 10 real `ArrowRight` keydown events live
on the TV and timed `navigation.js`'s actual handler execution -
`moveFocus`/`focus`/`scrollIntoViewNearest` - at ~9-10ms per press, which
is fast, not the bottleneck. That test only covers JS execution time
though; it can't capture the real physical-remote-press-to-visible-effect
pipeline (Bluetooth/IR → webOS input subsystem → browser event loop),
which there's no way to simulate from here.

Went looking for background load competing with that pipeline instead,
and found a real, substantial one: `weatherEffects.js`'s rain (24 drops)
and snow (18 flakes) layers, plus fog and lightning, all exist in the DOM
permanently (opacity-gated by `data-condition`, not conditionally
created), and their individual `animation: ... infinite` CSS rules run
**regardless of visibility** - CSS animations don't pause themselves just
because `opacity: 0` makes them invisible. Confirmed live:
`getComputedStyle(...).animationPlayState` was `"running"` for all of
them even with `data-condition="clear"` (the default/common state). Same
pattern found in `appleTvLayout.js`'s hero backdrops - all 3 slides'
Ken Burns animations ran simultaneously even though only one is ever
visible (`.hero__backdrop.is-active`). That's 45 continuously-animating
elements doing real GPU/compositor work, all the time, for zero visual
result most of the time - a plausible, substantial contributor to
sluggish-feeling input response on this TV's weak, old hardware.

Fixed with `animation-play-state: paused` by default, `running` only
when the matching `data-condition`/`.is-active` actually applies
(`weather-effects.css`, `layouts.css`). The hero fix worked on the first
try (verified: `["running","paused","paused"]` for the 3 backdrops,
active one correctly animating). The weather effects fix did NOT work on
the first attempt - all 4 still showed `"running"` after deploying -
caught only by re-verifying on-device rather than assuming the CSS was
correct because it looked right. Root cause: the `animation` shorthand
property resets its own `animation-play-state` sub-property to the
default ("running") wherever the shorthand itself is declared; a
separate `animation-play-state: paused` rule earlier in the file, at
equal specificity, was losing to that later shorthand declaration purely
by source order. Fixed by moving `animation-play-state: paused` to live
directly inside each shorthand-declaring rule instead of a separate rule
elsewhere - verified correct on a second on-device check
(`["paused","paused","paused","paused"]` at `data-condition="clear"`),
then additionally verified the condition-triggered `running` override
still works by temporarily forcing `data-condition="storm"` live and
confirming rain/fog/lightning (not snow - correct, storm doesn't trigger
snow) switched back to `"running"`.

**Honest framing for you:** this is a real, verified, substantial waste
that's now fixed - but I can't prove from here that it was *the* cause of
the sluggishness you felt, since I have no way to simulate an actual
physical remote button press through webOS's real input pipeline from
this environment. Please check whether navigation feels better now; if
it's still slow, that pipeline (outside this app's own JS, and outside
what I can test without you) is the next place to look.

## Settings focus preservation (v1.0.11)

"Selecting any setting moves focus to the top of the panel, then I have
to navigate back down one by one" - confirmed and root-caused before
fixing, not guessed:

`navigation.js`'s `moveFocus()` tracks the focused element as a direct DOM
reference (`currentEl`) and falls back to focusing the first element in
scope whenever `currentEl` is no longer found among the current
`[data-focusable]` elements (`if (!currentEl || !candidates.includes
(currentEl)) { focus(candidates[0]); return; }`). `settingsDrawer.js`'s
`render()` does `clear(body)` then rebuilds its *entire* content from
scratch - on literally every interaction (every pill, toggle, and
collapsible group header's `onclick` calls `render()` again after
updating settings) - which destroys whatever DOM node was focused. The
very next D-pad press then couldn't find `currentEl` in the fresh DOM and
fell back to the first element in the drawer.

Fixed in two pieces:

- `navigation.js`: added `getFocusIndexWithin(container)` /
  `focusIndexWithin(container, index)` - capture the focused element's
  *position* within a container before it's torn down, then refocus
  whatever is at that same position once the container is rebuilt.
  Index-based, not an identity/key match, because every
  render()-triggering control in this drawer preserves the total
  focusable count and ordering of everything before it - including a
  group header toggling its own body open/closed, since that only
  adds/removes elements *after* the header, not the header's own
  position.
- `settingsDrawer.js`: wrapped the one `render()` function itself
  (capture before `clear(body)`, restore after the last
  `body.appendChild(...)`) rather than touching each individual
  `onclick` - since every control recursively calls this same `render()`,
  one fix point covers all of them uniformly.

Verified live with real dispatched `ArrowDown`/`Enter` keydown events
(not direct `.click()` calls, which would bypass `navigation.js`
entirely and not actually exercise the bug) across three different
interaction types - a city pill select, a collapsible group header
toggle, and a pinned-app toggle - confirming each one leaves focus
exactly where it was (now showing its new selected/active state) and
that continued navigation from there behaves normally afterward.

One red herring during verification: an early test showed Settings
closing unexpectedly partway through a sequence, landing focus on a
dashboard tile. Traced this to stale app state left over from a real
multi-minute gap in this conversation (the devtools connection itself
briefly dropped and came back during that gap) - not reproducible in a
clean, immediately-following retest of the identical action sequence
(confirmed zero `tv:back` events fired across 30 real ArrowDown presses).
Noting this so a future session doesn't go looking for a phantom bug here
if something similar is ever seen again right after resuming a
long-paused session.

## Dashboard wallpaper fix (v1.0.12)
"Switching layout sometimes leaves a blank background; switching theme
changes the wallpaper fine." Investigated thoroughly live on-device
before changing anything, since the two actions call the *exact same*
code path (`main.js`'s single `onChange` handler runs `applyTheme`,
`mountLayout`, `applyWallpaperMode`, etc. unconditionally on every
settings change, regardless of which field actually changed) - so a real
mechanism difference between them seemed unlikely from reading the code
alone, and it wasn't:

- Stress-tested 150 rapid layout switches in a row (Apple TV → Bento →
  Minimal Dock, repeating) - page stayed responsive, never crashed.
- Collected every unique wallpaper the shuffle picked across those 150
  switches: all 63 pool entries (58 real photos + 5 built-in gradients)
  got picked at least once, each one correctly applied as either a valid
  `background-image` or `background` gradient - no gaps, nothing missing.
- Load-tested all 58 real photo URLs directly via `new Image()` with an
  8s timeout each: 58/58 succeeded, all in under 50ms (even the 3.2MB
  one) - ruled out slow/failed image decoding on this TV's limited
  memory as a cause.
- Checked a clean single layout switch with a `MutationObserver` on the
  wallpaper stack: proper overlapping crossfade (old layer fades out,
  new fades in, same instant, both over 1400ms), no gap where neither is
  visible.

None of that reproduced an actual failure. What it did surface: the 5
built-in CSS gradients (`core/wallpapers.js`'s `DEFAULT_WALLPAPERS`) are
all deliberately dark/subtle (navy, brown, indigo, teal, purple tones) to
match the glass aesthetic - but against this app's already-dark theme,
one of them being picked (5 of 63 pool entries, ~8% per pick) looks very
close to no wallpaper at all. Since `pickRandom()` is identical for
every trigger, this was always equally likely on a theme switch too -
you'd just happened to hit it more while testing layouts.

Per your choice (excluded, not brightened): `getAllWallpapers()` now
excludes `DEFAULT_CATEGORY` (the generated gradients) from the dashboard
context specifically, whenever any real custom wallpaper exists
(`customWallpapers.length > 0`) - guarded so a genuinely empty
`src/assets/wallpapers/` folder still falls back to the gradients rather
than a truly blank dashboard, and so explicitly re-enabling
"Default (generated) → Dashboard" in Settings still works (that's a
concrete array that includes the category, handled by the function's
existing `enabled` branch, untouched). Screensaver's own "everything"
default is unchanged - only the dashboard was reported as having this
problem. Verified live: 0 gradient picks across 100 combined
layout+theme switches post-fix (was ~8 expected pre-fix).

One red herring chased down and ruled out along the way: an initial
`ls` of the TV's installed assets folder showed 127 `.jpg`/`.jpeg` files
against ~62 in `src/assets/wallpapers/`, suggesting `dev/install` might
not be cleaning out old files across repeated deploys. Rechecked after
the next clean install: 61 files, matching expectations, and the app
directory's total size (12.9MB) matches a single clean install, not
accumulated bloat. The 127 reading was a one-off measurement taken at
some mid-session moment, not a real `dev/install` behavior - not worth
further chasing, but noting it here in case the same false signal comes
up again.

## Elevated listLaunchPoints fallback (v1.0.13)
Asked to try making the Input Source dropdown actually work - it's always
been correctly built to show nothing rather than guess (see the earlier
"Known limitation" entry), so the only way to actually fix it was finding
a way around the `listLaunchPoints` permission denial itself.

**Found and verified live, before writing any production code:**
Homebrew Channel's own service (`org.webosbrew.hbchannel.service`,
already installed - read its actual `service.js` on the TV via SSH, not
guessed) exposes an `exec` method (`{command: "<string>"}`) that runs a
shell command via Node's `child_process.exec`, with the service itself
running as root. Confirmed two separate things live, not assumed:

1. Our own app's identity (not just root SSH) can actually reach this
   method - fired `window.webOS.service.request(...)` from the running
   app's own console, got back real stdout.
2. The command genuinely executes as root - tested with `command: "id"`,
   got `uid=0(root) gid=0(root) ...` back.

Then confirmed the full intended chain works end-to-end from the app's
own context: `exec` -> `script -qc "luna-send -n 1
luna://com.webos.applicationManager/listLaunchPoints '{}'" /dev/null`
(the `script` wrapper is required for the same luna-send-needs-a-pty
reason documented elsewhere in this file) -> real JSON with all 19 real
launch points, parses cleanly.

This is a narrow, deliberate use of a capability Homebrew Channel already
exposes for exactly this purpose (letting other homebrew apps use the
root access the TV was already rooted for) - not a new attack surface
(no new port, no new listening service, purely an internal Luna Bus call
between two already-installed local apps) and the command is 100%
hardcoded with no variable/user input, so no injection surface despite
running as root.

**Real cost found and handled, not glossed over:** the elevated round
trip measured ~3.2s on this hardware (spawning `script`+`luna-send` isn't
fast here) against the direct call's ~6ms. Icon/app discovery already
blocked the dashboard's first paint before this change
(`await resolveWebOSIcons(...)` in `main.js`'s `boot()`), so wiring this
in naively would've silently added ~3s to every single boot on this TV
(where the direct call always fails). Per your choice: accepted the
delay, added a boot loader (`index.html`'s static `#boot-loader` +
`base.css`, removed by `main.js` once the dashboard actually mounts) to
cover it rather than leaving a blank screen.

**Real bug found and fixed while implementing this, not left for you to
discover:** `getPinnedApps()`/Settings' pinned-apps toggle both match
stored pin keys by equality against `getPinnableApps()`'s results. Those
results are keyed by this app's own static-catalog keys (e.g.
`"youtube"`) when nothing's discovered, but by each app's REAL webOS id
(e.g. `"youtube.leanback.v4"`) once discovery actually works - which
don't match for most of the catalog (only `netflix`/`browser` happen to
coincide). Without a fix, the moment this elevated path started
succeeding, most of your currently-pinned apps would have silently
vanished from the dashboard, and toggling one "off" in Settings
wouldn't have actually unpinned it (filtering by the wrong key form,
leaving it stuck "on" from the dashboard's perspective next render).
Fixed with a bridge (`data/apps.js`'s new `getStaticKeyForAppId`) used on
both the dashboard's read path and Settings' toggle's read *and* write
paths.

**Honest expectation-setting for Input Source specifically:** this fixes
the *permission* problem, so icon resolution and Pinned Apps discovery
should now genuinely work. But this TV's actual `listLaunchPoints`
response (captured earlier this session) has zero entries matching
`data/inputs.js`'s HDMI/input-pattern filter - none of its 19 real launch
points look like an input source at all. So the Input Source dropdown
will most likely still show "No inputs detected," not from permission
denial anymore, but because this firmware doesn't appear to expose HDMI
inputs as launch points in the first place - a different, deeper
limitation this same fix can't reach. Confirm once you've tested; if
still empty, that's expected and not a sign the fix failed.

## Other small requests this round (v1.0.13)

- `.hero__scrim` (Apple TV) - bottom opacity 0.82 -> 0.5.
- `.bento__hero` - was painting its backdrop gradient as a fully opaque
  `background`, completely blocking the dashboard wallpaper behind it.
  Split into a separate `.bento__hero-backdrop` layer at 0.45 opacity
  (same z-index:-1-relative-to-its-own-stacking-context trick already
  used for the dashboard wallpaper stack), sitting above the glass-panel's
  own translucent tint and below the text, so the wallpaper now shows
  through.
- Settings panel font sizes bumped across the board (title, section
  labels, option pills, rows, pinned items, field labels, text inputs,
  group titles, chevrons, category pills).

## Icon fallback fix (v1.0.14)
Reported right after testing v1.0.13: broken icons and app names written
instead, with names now showing twice per tile. Diagnosed live before
guessing:

- Inspected every tile's `<img>` on the real page: all had
  `complete: true` but `naturalWidth: 0` - a genuine failed load/decode,
  not a styling issue - and `hasGlyph: false` on every one, meaning the
  intended broken-image-to-glyph swap never happened at all.
- Checked whether `Element.prototype.replaceWith` (what the swap used)
  exists on this engine: `document.createElement("img").replaceWith` is
  `undefined` there, while the older `.remove()` exists fine - matches
  `replaceWith`'s known landing in Chrome 54, one version after this
  TV's real Chrome 53. This is the ChildNode-mixin method set
  (`before`/`after`/`replaceWith`) that landed together, later than the
  much older `remove()` - confirmed all three missing, `remove` present.
- Checked the icon *files* themselves aren't the problem: SSH'd to the
  TV and confirmed real, non-empty PNGs exist at the exact paths
  `listLaunchPoints` returned (e.g. Netflix's `SMALL_APP_ICON.png`,
  2-5KB real files, not missing/corrupt). The failure is specifically
  this app's web view being unable to load `file://` images from other
  apps' installed directories - a platform sandboxing boundary, separate
  from (and not fixable the same way as) the Luna Bus ACL denial this
  session already worked around for `listLaunchPoints` itself.

Fixed by replacing the two `el.replaceWith(...)` call sites
(`appTile.js`'s broken real-icon fallback, `settingsDrawer.js`'s pinned-
list equivalent) with a new `core/dom.js` helper, `replaceEl(oldEl,
newEl)`, built on `parentNode.replaceChild()` - a core DOM Level 1
method, universally supported, doing the exact same job. Verified the
swap mechanism works on this engine with a live manual test *before*
building/deploying the real fix (swapped a real broken `<img>` for a
test `<span>` via `replaceChild` from the DevTools console - succeeded),
then verified the actual shipped fix the same way: every one of 10
tiles now shows `hasGlyph: true, hasImg: false` with no duplicate label
text.

Real icons still won't display (the sandboxing boundary above still
applies) - this fix restores the *intended* fallback behavior (clean
glyph, no broken image, no duplicate text), which is what was actually
reported broken. Making real cross-app icons work would need a
different, bigger approach (e.g. reading icon bytes through the same
elevated exec path and re-serving them as `data:` URIs) - not attempted,
flagging as a possible future item only since it wasn't what was asked.

## Input Source removal + opacity restored (v1.0.15)
Two requests: remove the Input Source button (confirmed not functional -
see this TV's actual launch points, already captured, zero HDMI-pattern
matches), and "opacity of app tiles & hero panels has gone, bring it
back."

**Input Source removal:** fully deleted, not just hidden -
`components/inputSwitcher.js` and `data/inputs.js` removed outright
(nothing else referenced either), `main.js`'s wiring (creation,
`tv:toggle-settings`/`tv:back` handlers, the mutual-exclusion-with-
Settings logic) and `statusbar.js`'s `inputSwitcherEl` prop/slot both
simplified back to how they'd look without the feature, and the
now-dead `.input-switcher*` CSS rules removed from `statusbar.css`.
Matches this project's existing "no dead code" convention.

**Opacity:** checked live before changing anything, since "has gone"
implies a regression and none of my recent changes (hero__scrim,
bento__hero-backdrop) actually touched app tiles at all - confirmed
`.app-tile`'s background was still exactly `rgba(18, 20, 26, 0.88)`,
unchanged, and `bento__hero-backdrop` was correctly `0.45` as set
earlier. So this wasn't a regression to find - it was new ground: app
tiles and `.bento__hero` itself (as opposed to the backdrop layer I'd
already split out for it) had simply never been included in the earlier
"let the wallpaper show through" round. You also wondered whether the
new generic same-glyph-for-every-discovered-app situation was somehow
the cause - worth checking rather than dismissing, but it isn't:
`currentColor` (what the glyph's tint uses) and `background-color` (the
tile's own fill) are unrelated CSS properties: the glyph's own tint
could be wrong and the tile's background opacity would be completely
unaffected, and vice versa. Fixed by giving `.app-tile` and `.bento__hero`
their own explicit `background: rgba(18, 20, 26, 0.45)` (same value
already used for the backdrop layer, for visual consistency) - these win
over `.glass-panel`'s own default via source order (same specificity,
`layouts.css` loads after `glass.css`). Verified live:
`getComputedStyle(...).backgroundColor` for both now reports
`rgba(18, 20, 26, 0.451)`, matching.

## Deferred

**LG Input Hook (Home-button remap)** - explicitly held off per your
choice this session. It runs a background HTTP control service on port
1842, bound to all interfaces, not just localhost, with weak/no auth for
local callers and a path-handling bug in its `/config/` endpoint that
could let an authenticated-but-untrusted LAN client read/write outside
its config directory - flagged per this repo's CLAUDE.md rule to call out
attack-surface changes before doing them. If you want to revisit:
install id is `org.webosbrew.inputhook` (download the `.ipk` from its
GitHub Releases, no Homebrew App Store listing as of this research), the
keybinds config lives at `/home/root/.config/lginputhook/keybinds.json`,
and the Home button's raw ID was documented as `773` for an MR21GC Magic
Remote in the project's own "Button IDs.md" (verify against this TV's
actual remote via the in-app log view - IDs aren't guaranteed accurate
across remote models/firmware). The README only documents Disable/
Execute-a-command/Replace-with-another-button-ID actions for a remap, not
"launch this app id" directly - Execute would need to shell out to
`luna-send luna://com.webos.applicationManager/launch
'{"id":"com.tvdashboard.home"}'`, unverified against this specific tool.

## What remains (the real open items)

1. Your call: install LG Input Hook (see "Deferred" above) once you're
   ready to accept that attack-surface tradeoff.
2. Optional: say if you want Plex removed from the catalog/default pins
   too - it's not actually installed on this TV either (same as Spotify
   was), currently left alone since you only asked about Spotify.
3. Optional: pin any of the 12 newly-added real apps (ZEE5, SonyLIV,
   JioCinema, Voot, Amazon Alexa, LG Content Store, Photo & Video, Music,
   Home Dashboard, Pac-Man, Homebrew Channel, Developer Mode) via
   Settings → Pinned Apps if you want them on the home screen - none are
   pinned by default, see "On-TV feedback round 1" above for why.
4. Optional, your call: a free TMDB API key, a live Plex server
   URL/token, more/compressed wallpaper images - all already wired up and
   waiting, none required for the app to work.
5. Keep reacting to the design/UX as you use it on the real TV now - still
   the main open loop this whole project has run on.
6. Nothing has been committed to git yet - everything across this
   session's rounds (wallpaper filename/rotation fixes, the new
   `launcher/public/` packaging files, `webosBridge.js`, the expanded app
   catalog, always-visible tile labels, header sizing, the hero rotation
   slowdown, the real percentage-height icon bug fix, and the
   `scrollIntoView` navigation fix) is unstaged.

## Blockers / open questions

- None blocking. The devmode SSH flakiness (see "Where things stand") is
  a workaround-in-place situation, not a hard blocker - the manual
  `dev/install` path works reliably.
