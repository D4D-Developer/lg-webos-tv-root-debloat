// Physical input sources (HDMI 1-4, etc.), shown only if they're actually
// real. webOS treats these as launchable "apps" through the exact same
// applicationManager/launch Luna call already used everywhere else in this
// app (core/platform.js's launchApp) - LG's own Home screen appears to
// source its input tiles from the same launch-point system as regular
// apps, which is why this looks in the existing discovered-apps list.
//
// No hardcoded placeholder list: a guessed "HDMI 1-4" might not even match
// what this TV actually has (wrong count, wrong names, inputs beyond
// HDMI), and an unconfigured appId wouldn't do anything on click anyway -
// showing nothing is more honest than showing fake options. Empty off-
// device (nothing to discover) and on a real TV until confirmed what
// pattern its input entries actually use.

const INPUT_ID_PATTERN = /hdmi|externalinput|av[-_ ]?in|component|livetv/i;

export function getInputSources(discoveredApps) {
  return discoveredApps
    .filter((app) => INPUT_ID_PATTERN.test(app.id) || INPUT_ID_PATTERN.test(app.label))
    .map((app) => ({ key: app.id, label: app.label, appId: app.id, websiteUrl: null }));
}
