# Phase 2 — Debloat

Tool used: [akshayskhurd/lg-webos-root-debloat](https://github.com/akshayskhurd/lg-webos-root-debloat)
(`webos-debloat.sh`). It **hides** apps from the launcher by writing to
`/var/preferences/com.webos.applicationManager/blockedSystemAppList/<REGION>.json` —
nothing is uninstalled, and it keeps a backup of the original file on first run, so
it's fully reversible.

## 1. Find your region code

The script guesses `USA` by default. Check the real one first:

```sh
luna-send -n 1 -a com.webos.app.debloat luna://com.webos.service.settings/getSystemSettings '{"category":"option"}' | grep -o '"country":"[A-Z]*"'
```

Pass `--region <CODE>` on every command below if it isn't `USA`.

## 2. Pick categories/apps to hide

```sh
sh webos-debloat.sh --list                       # see everything installed
sh webos-debloat.sh --plan --region <CODE>        # default categories: ad, sdk, demo, remote
sh webos-debloat.sh --plan --only <cats> --id "<extra ids>" --region <CODE>
```

Categories available: `ad` (ACR/tracking components), `sdk` (dev/test stubs), `demo`
(store demo/sync demo), `remote` (remote-service stub). Opt-in extras exist for promo
apps, "visible" bloat tiles, and misc extras — read the script's own `--help` /
source for the exact IDs before adding them; some of what looks removable is actually a
real feature (e.g. the LG Content Store app is **not** something you want to hide).

Always review the plan output before applying — know what each app ID actually is
before hiding it.

## 3. Apply + extra cleanup

```sh
sh webos-debloat.sh --apply --only <cats> --id "<extra ids>" --region <CODE>
sh webos-debloat.sh --settings-off          # disable promo/content-recommendation settings
sh webos-debloat.sh --preload-off           # stop specific apps from preloading at boot
sh webos-debloat.sh --status                # confirm what's hidden
```

## 4. Verify correctly

`listApps` returns every installed app regardless of hidden status — it is **not** the
right way to check. The launcher actually consults `listLaunchPoints`:

```sh
luna-send -n 1 -a com.webos.app.debloat luna://com.webos.service.applicationmanager/listLaunchPoints '{}' | grep -o '"id":"[^"]*"'
```

Confirm the hidden IDs are genuinely absent from this list.

## 5. Persist across reboots — known script bug

`webos-debloat.sh --install-boot-hook` writes `/var/lib/webosbrew/init.d/50-debloat`,
but **it only bakes in `--only <categories>`** — it drops any custom `--id` list and
`--region` override you used. If you picked extra app IDs or a non-`USA` region, the
auto-generated hook will silently fail to re-apply them on a future reset.

Fix: after confirming your hidden list is correct (`IND.json` /
`<REGION>.json` in `blockedSystemAppList/`), extract the live ID list and write the hook
manually with the full list + region baked in as static text — see
[`boot-hook/50-debloat`](../boot-hook/50-debloat) in this repo for the template.

Test it directly before trusting it: `sh /var/lib/webosbrew/init.d/50-debloat`, then
check `/var/lib/webos-debloat/boot.log` for errors.

## Notes / open items

- One previously-visible app (`com.webos.app.music`) persisted in `listLaunchPoints`
  despite being correctly listed in the blocked-apps JSON, for reasons not fully
  root-caused. Low-stakes (not an ad/tracking app) — not pursued further.
- `/tmp` is wiped on every reboot — re-download the script there each time if you need
  to run it ad hoc (the persistent copy lives at `/var/lib/webos-debloat/webos-debloat.sh`).
