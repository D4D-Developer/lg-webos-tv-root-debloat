// Abstracts "launch an app" over two very different realities:
//   - On a real webOS TV, the runtime injects a global `webOS` object and
//     apps launch each other through the Luna Service Bus
//     (com.webos.applicationManager / launch), addressed by exact system
//     app IDs.
//   - In a normal desktop browser (this dev server), none of that exists,
//     so we fall back to opening the app's website - good enough to test
//     every bit of UI/UX, not meant to be a real launch.
//
// The appId values in data/apps.js's static catalog are PLACEHOLDERS
// (null) and were never guessed - a wrong ID fails silently on a real
// remote with no feedback. That catalog is now only the local-dev
// fallback, though: on a real TV, Settings -> Pinned Apps pins from the
// live discovered-apps list instead (core/icons.js), whose `appId` is
// always the TV's own real id, not a guess - so launching a pinned app
// already works there with no manual step. The SSH command below is only
// still useful for manually inspecting the raw list:
//
//   ssh root@<tv-ip> luna-send -n 1 -f \
//     luna://com.webos.applicationManager/listLaunchPoints '{}'

export function isWebOS() {
  return typeof window !== "undefined" && !!window.webOS && !!window.webOS.service;
}

export function launchApp(app) {
  if (!app.appId) {
    console.warn(
      `[platform] "${app.label}" has no real webOS appId yet - see the ` +
        `luna-send command in core/platform.js. Dev fallback only.`
    );
    devFallback(app);
    return;
  }

  if (isWebOS()) {
    // Shape matches the commonly-documented webOS TV Luna Service Bus call;
    // re-verify against the real device once we can reach it (Homebrew
    // Channel's web inspector, or `window.webOS` directly over SSH debug).
    window.webOS.service.request("luna://com.webos.applicationManager", {
      method: "launch",
      parameters: { id: app.appId },
      onSuccess: () => console.log(`[platform] launched ${app.appId}`),
      onFailure: (err) =>
        console.error(`[platform] failed to launch ${app.appId}`, err),
    });
    return;
  }

  devFallback(app);
}

function devFallback(app) {
  console.log(`[platform:dev] would launch "${app.label}" (${app.appId ?? "no id"})`);
  if (app.websiteUrl) {
    window.open(app.websiteUrl, "_blank", "noopener,noreferrer");
  }
}
