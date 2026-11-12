# LG webOS TV — Root + Debloat

Personal reference notes for rooting and debloating an LG webOS Smart TV using the
open-source [Homebrew Channel / webosbrew](https://webosbrew.org) ecosystem.

**Scope:** webOS 4.x TVs (this was done on an LG webOS 4.10 set, firmware `05.4x.xx`
class). The method generalizes to other webOS 4.x/5.x/6.x models that
[cani.rootmy.tv](https://cani.rootmy.tv) reports as rootable — check your own model/firmware
there before doing anything.

**No secrets here.** No private keys, IP addresses, Wi-Fi/network details, or other
device-identifying info are included. Everything below is either a generic procedure or
a config artifact (app ID lists, boot hook) that is identical across TVs of the same
model line — not specific to any one unit.

## Phases

1. **[Root](docs/01-root.md)** — Developer Mode → key exchange → faultmanager exploit →
   Homebrew Channel install → root SSH, default password retired.
2. **[Debloat](docs/02-debloat.md)** — hide ad/telemetry/demo/SDK system apps from the
   launcher (reversible, nothing uninstalled), disable promo/content-recommendation
   settings, block OTA update hosts, persist across reboots via a boot hook.
3. **[UI/UX notes (parked)](docs/03-ui-ux-notes.md)** — scoping notes on a custom
   launcher, not yet started.

## Credits (all the real work is upstream)

- [webosbrew/webos-homebrew-channel](https://github.com/webosbrew/webos-homebrew-channel) — the root/jailbreak app itself.
- [throwaway96/faultmanager-autoroot](https://github.com/throwaway96/faultmanager-autoroot) — the root exploit.
- [cani.rootmy.tv](https://cani.rootmy.tv) — compatibility checker for your specific model/firmware.
- [akshayskhurd/lg-webos-root-debloat](https://github.com/akshayskhurd/lg-webos-root-debloat) — the debloat script.

## Disclaimer

Rooting voids your warranty and carries a real (if small, with this exploit) risk of
bricking the TV. Read [rootmy.tv/warning](https://rootmy.tv/warning) first. This repo is
notes from one specific exploit/debloat run, not a guarantee it will work identically on
your unit. Use at your own risk.
