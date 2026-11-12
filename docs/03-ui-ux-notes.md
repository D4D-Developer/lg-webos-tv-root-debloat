# Phase 3 — UI/UX

**Status: in progress** (started 2026-11-12) — see [docs/progress.md](progress.md) for
current status and [docs/handoff.md](handoff.md) for the active work thread. What
follows below is the original scoping/research that preceded it; option 1 is the one
being built, in [launcher/](../launcher/).

## Options considered

1. **Build a custom launcher as a proper webOS Studio/Enact project.** Full visual and
   functional freedom (it's just a web app) — custom layout/theme/widgets, and real
   system integration via the Luna Service Bus (`listLaunchPoints` to enumerate apps,
   `applicationManager/launch` to open them, input/HDMI status, etc.), not just a
   hardcoded shortcut list.
2. **Try the existing community launcher** ([partridgeworks/webos-launcher](https://github.com/partridgeworks/webos-launcher)) —
   explicitly built/tested for webOS 6 (Chrome 79) only; README states compatibility
   with webOS 5-and-earlier is unknown. Likely incompatible with webOS 4.x hardware.
3. **Remap the Home button via [LG Input Hook](https://github.com/Simon34545/lginputhook)**
   (`org.webosbrew.inputhook`) to launch a frequently-used app directly. Persists across
   reboots. This is the only confirmed-working low-level mechanism for intercepting the
   Home button at all.
4. **Stop at Phase 2.** ← current state.

## Hard limit found during research

There is no documented/known-safe way to make a custom app the TV's actual registered
**Home** app. The real LG Home app keeps existing and running underneath no matter what;
a custom launcher is a separate app you reach via the Input Hook remap (option 3) or by
opening it manually — not a true replacement.

## If this is picked back up

Per normal project kickoff: scope the actual product idea first (what should the home
screen show, favorites vs. full grid, widgets, theming), confirm it's single-TV personal
use (not multi-device/shareable), then write a short plan/doc before writing any code.
