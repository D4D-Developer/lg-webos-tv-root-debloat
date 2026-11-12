# Phase 1 — Root

## 1. Check compatibility

Look up your exact model + firmware on [cani.rootmy.tv](https://cani.rootmy.tv). If it's
not listed as rootable, stop here.

## 2. Developer Mode + key exchange

1. Install **Developer Mode** from the LG Content Store, sign in with an LG developer
   account.
2. In Developer Mode app: note the TV's IP, enable **Key Server** (serves the SSH key on
   port 9991), and generate a one-time passphrase.
3. From a computer on the **same network/band** as the TV (AP/client isolation between
   2.4GHz/5GHz bands on some routers will silently hang this step — same SSID isn't
   enough, confirm the TV and computer are actually on the same band/segment):
   ```sh
   ares-setup-device   # register the TV's IP as a target
   ares-novacom --device <target> --getkey   # fetches the devmode SSH keypair, prompts for the passphrase
   ```

This devmode SSH (historically port 9922) is only used to get a foothold — it is not the
root shell, and `ares-shell` does **not** work against real hardware (only webOS OSE /
Raspberry Pi builds). Connect with a raw `ssh` instead once you have the key.

## 3. Run the root exploit

```sh
curl -L -o /tmp/autoroot.sh https://github.com/throwaway96/faultmanager-autoroot/releases/latest/download/autoroot.sh
sh /tmp/autoroot.sh
```

This triggers a deliberate crash in a privileged service to gain root and installs the
**Homebrew Channel** app. Reboot the TV when it finishes. The Homebrew Channel icon
appears on the launcher after reboot.

## 4. Homebrew Channel settings

Open Homebrew Channel on the TV → Settings ("Root Configuration"):

- **SSH Server** → on (this is what you actually use afterward, not the old devmode SSH).
- **Telnet** → off.
- **Block system updates** → on if you don't want OTA firmware updates (this is a
  reversible `/etc/hosts` bind-mount redirecting LG's update hostnames to localhost — it
  does not touch anything else, and toggling it off + reboot undoes it fully).

Reboot to apply.

## 5. Connect as root

Homebrew's SSH server is **dropbear on standard port 22** (not 9922). Modern OpenSSH
(8.8+) has deprecated the `ssh-rsa` host key type dropbear still offers, so you need:

```sh
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@<tv-ip>
```

First login uses a documented default password (`alpine` — this is webosbrew's own
public default, not a secret: see their
[startup.sh](https://github.com/webosbrew/webos-homebrew-channel/blob/main/services/startup.sh)).
Retire it immediately:

```sh
ssh-keygen -t ed25519 -f ~/.ssh/tv_root -C "tv-root"
cat ~/.ssh/tv_root.pub   # copy this
```

On the TV, create `/home/root/.ssh/authorized_keys` with that public key, then reboot.
The startup script only sets the placeholder password **when `authorized_keys` doesn't
exist yet** — once a key is present, that whole branch is skipped on the next boot,
permanently retiring the default password (you don't need `passwd` to succeed here; it
will fail anyway since the rootfs is read-only, and that's expected/harmless).

Confirm it worked: `/etc/motd` no longer shows the "using a default password" warning
after the reboot.
