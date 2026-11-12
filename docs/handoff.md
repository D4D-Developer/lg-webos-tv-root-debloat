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
- [x] In progress — extensive feature set built and passing local-browser
      testing. Not yet viewed on the real TV.

## Where things stand
- Dev server: `cd launcher && npm run dev` -> http://localhost:5173/.
- Everything that can be tested off-device has been (repeatedly, via actual
  browser interaction + console/state inspection, not just code review).
  Everything that's webOS-only (Luna Service Bus calls: icon resolution,
  installed-app discovery, real app launching) is unverified on real
  hardware - this environment has no TV to test against.
- Nothing has been committed to git yet.

## What remains (the real open items)
1. **Get on an actual TV** - this is the big one. Most remaining unknowns
   (webOS engine version, Luna Service Bus response shapes, whether
   installed-app discovery returns something useful or a long noisy system
   list, whether the legacy/nomodule build actually runs) can only be
   resolved there. See progress.md's backlog for the full itemized list.
2. Decide the actual TV deployment mechanism (ares CLI packaging vs.
   something simpler given the existing root/Homebrew access).
3. Optional, your call: a free TMDB API key, a live Plex server
   URL/token, more/compressed wallpaper images - all already wired up and
   waiting, none required for the app to work.
4. Keep reacting to the design/UX as you use it - still the main open loop
   this whole project has run on.

## Blockers / open questions
- None blocking further UI work. Everything above requires physical
  TV/network access this environment doesn't have.
