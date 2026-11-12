import { h, clear, replaceEl } from "../core/dom.js";
import { getSettings, updateSettings, CITY_PRESETS } from "../core/settings.js";
import { getPinnableApps, getStaticKeyForAppId } from "../data/apps.js";
import { shiftPixelsOnce } from "../core/oled.js";
import { setScope, releaseScope, getFocusIndexWithin, focusIndexWithin } from "../core/navigation.js";
import { getCategories, DEFAULT_CATEGORY } from "../core/wallpapers.js";
import { glyphIcon } from "./iconGlyph.js";

const LAYOUT_OPTIONS = [
  { value: "apple-tv", label: "Apple TV" },
  { value: "bento", label: "Ambient Bento" },
  { value: "minimal-dock", label: "Minimal Dock" },
];

const THEME_OPTIONS = [
  { value: "obsidian", label: "Obsidian Glass" },
  { value: "warm-cinema", label: "Warm Cinema" },
  { value: "monochrome", label: "Monochrome B&W" },
  { value: "pure-void", label: "Pure Void" },
];

function formatCategoryLabel(category) {
  if (category === DEFAULT_CATEGORY) return "Default (generated)";
  return category
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function optionPill(option, isActive, onSelect) {
  return h(
    "button",
    {
      class: `settings-option${isActive ? " is-active" : ""}`,
      "data-focusable": "true",
      onclick: onSelect,
    },
    option.label
  );
}

// A real native <input> - the only place this app needs actual text entry.
// Deliberately does NOT call the drawer's render() on every keystroke (that
// would destroy and recreate the input element on every character, losing
// focus mid-type) - it commits once, on blur, triggered by Enter/Escape.
// `stopPropagation` on every key is what keeps the global D-pad handler
// from also reacting while typing: without it, an arrow key would move
// spatial focus instead of the text cursor, Backspace would trigger "back"
// and close the drawer, and typing a literal "s" would toggle Settings.
function textField({ value, placeholder, masked = false, onCommit }) {
  return h("input", {
    class: "settings-input",
    "data-focusable": "true",
    type: masked ? "password" : "text",
    value: value || "",
    placeholder: placeholder || "",
    // navigation.js activates the spatial-nav selection via `.click()`,
    // which is NOT guaranteed to also give native focus the way a real
    // pointer click does - without this, D-pad Enter would show the focus
    // ring but never actually let you type.
    onclick: (e) => e.target.focus(),
    onkeydown: (e) => {
      e.stopPropagation();
      if (e.key === "Enter" || e.key === "Escape") e.target.blur();
    },
    onblur: (e) => onCommit(e.target.value.trim()),
  });
}

export function createSettingsDrawer({ onChange }) {
  const body = h("div", {});
  const drawer = h("div", { class: "settings-drawer glass-panel" }, [
    h("div", { class: "settings-drawer__title" }, "Settings"),
    body,
  ]);
  const overlay = h(
    "div",
    {
      class: "settings-overlay",
      onclick: (e) => {
        if (e.target === overlay) close();
      },
    },
    [drawer]
  );

  function section(label, content) {
    return h("div", { class: "settings-section" }, [
      h("div", { class: "settings-section__label" }, label),
      content,
    ]);
  }

  // Collapsible top-level groups - cuts the drawer from one long continuous
  // scroll down to a short list of headers, each expandable on demand.
  // Expand state is ephemeral UI state (not persisted to settings/
  // localStorage): it's about decluttering this one session's view, not a
  // preference worth remembering across reloads.
  const expandedGroups = new Set(["appearance"]);

  function group(key, title, contentNodes) {
    const isExpanded = expandedGroups.has(key);
    const header = h(
      "button",
      {
        class: "settings-group__header",
        "data-focusable": "true",
        onclick: () => {
          if (isExpanded) expandedGroups.delete(key);
          else expandedGroups.add(key);
          render();
        },
      },
      [
        h("span", { class: "settings-group__title" }, title),
        h("span", { class: "settings-group__chevron" }, isExpanded ? "▾" : "▸"),
      ]
    );
    const bodyEl = isExpanded
      ? h("div", { class: "settings-group__body" }, contentNodes)
      : null;
    return h("div", { class: "settings-group" }, [header, bodyEl].filter(Boolean));
  }

  function render() {
    // Every control below updates settings then calls this same render()
    // again, which tears down and rebuilds the whole drawer body from
    // scratch rather than patching just what changed - that destroyed
    // whatever element navigation.js had focused, so the very next D-pad
    // press couldn't find it anymore and fell back to focusing the first
    // element in the drawer ("selection jumps to the top after selecting
    // anything"). Capturing/restoring by position here, once, covers
    // every control uniformly without needing each individual onclick to
    // know about it. See navigation.js's getFocusIndexWithin for why
    // index-based position (not an identity/key match) is safe here.
    const focusIndex = getFocusIndexWithin(body);
    clear(body);
    const settings = getSettings();

    const layoutOptions = h(
      "div",
      { class: "settings-options" },
      LAYOUT_OPTIONS.map((opt) =>
        optionPill(opt, settings.layout === opt.value, () => {
          updateSettings({ layout: opt.value });
          onChange(getSettings());
          render();
        })
      )
    );

    const themeOptions = h(
      "div",
      { class: "settings-options" },
      THEME_OPTIONS.map((opt) =>
        optionPill(opt, settings.theme === opt.value, () => {
          updateSettings({ theme: opt.value });
          onChange(getSettings());
          render();
        })
      )
    );

    const cityOptions = h(
      "div",
      { class: "settings-options" },
      CITY_PRESETS.map((city) =>
        optionPill({ value: city.name, label: city.name }, settings.city.name === city.name, () => {
          updateSettings({ city });
          onChange(getSettings());
          render();
        })
      )
    );

    const weatherFxToggle = h("div", {
      class: `settings-toggle${settings.weatherEffectsEnabled ? " is-on" : ""}`,
    });
    const weatherFxRow = h("div", { class: "settings-row" }, [
      h("span", {}, "Weather effects (rain/fog/snow/storm)"),
      h(
        "button",
        {
          "data-focusable": "true",
          onclick: () => {
            updateSettings({ weatherEffectsEnabled: !settings.weatherEffectsEnabled });
            onChange(getSettings());
            render();
          },
        },
        [weatherFxToggle]
      ),
    ]);

    // Real installed apps if we're on-device and they resolved, otherwise
    // the static demo catalog - see data/apps.js's getPinnableApps(). This
    // list could be long/noisy with real system apps once tested on an
    // actual TV (nothing filters it down to "likely wanted" yet) - no way
    // to know what that actually looks like without a real device.
    const pinnableApps = getPinnableApps();
    const pinnedList = h(
      "div",
      { class: "settings-pinned-list" },
      pinnableApps.map((app) => {
        // `app.key` is the discovered app's real webOS id once live
        // discovery works - a pin stored before that (under this
        // catalog's own arbitrary key, e.g. "youtube") needs the same
        // old-key<->real-id bridge on both the read (isPinned) and write
        // (the toggle's onclick below) side, or toggling "off" here
        // would filter the real id while the actually-stored old key
        // silently stays pinned (reappearing via getPinnedApps' own
        // matching bridge) - see that function's comment in data/apps.js.
        const staticKey = getStaticKeyForAppId(app.key);
        const isPinned =
          settings.pinnedApps.includes(app.key) || (staticKey && settings.pinnedApps.includes(staticKey));
        const toggle = h("div", { class: `settings-toggle${isPinned ? " is-on" : ""}` });
        const icon = app.iconUrl
          ? h("img", {
              class: "settings-pinned-glyph",
              src: app.iconUrl,
              alt: app.label,
              onerror: (e) => replaceEl(e.target, glyphIcon(app.glyph, { class: "settings-pinned-glyph" })),
            })
          : glyphIcon(app.glyph, { class: "settings-pinned-glyph" });
        return h(
          "button",
          {
            class: "settings-pinned-item",
            "data-focusable": "true",
            onclick: () => {
              const next = isPinned
                ? settings.pinnedApps.filter((k) => k !== app.key && k !== staticKey)
                : [...settings.pinnedApps, app.key];
              updateSettings({ pinnedApps: next });
              onChange(getSettings());
              render();
            },
          },
          [
            h("div", { class: "settings-pinned-item__label" }, [icon, h("span", {}, app.label)]),
            toggle,
          ]
        );
      })
    );

    const heroToggle = h("div", {
      class: `settings-toggle${settings.useRealHeroContent ? " is-on" : ""}`,
    });
    const heroToggleRow = h("div", { class: "settings-row" }, [
      h("span", {}, "Real content (Plex + TMDB fallback)"),
      h(
        "button",
        {
          "data-focusable": "true",
          onclick: () => {
            updateSettings({ useRealHeroContent: !settings.useRealHeroContent });
            onChange(getSettings());
            render();
          },
        },
        [heroToggle]
      ),
    ]);
    const heroFields = settings.useRealHeroContent
      ? h("div", { class: "settings-fields" }, [
          h("div", { class: "settings-field__label" }, "Plex Server URL"),
          textField({
            value: settings.plexServerUrl,
            placeholder: "http://192.168.1.50:32400",
            onCommit: (v) => {
              updateSettings({ plexServerUrl: v });
              onChange(getSettings());
            },
          }),
          h("div", { class: "settings-field__label" }, "Plex Token"),
          textField({
            value: settings.plexToken,
            placeholder: "your Plex auth token",
            masked: true,
            onCommit: (v) => {
              updateSettings({ plexToken: v });
              onChange(getSettings());
            },
          }),
          h("div", { class: "settings-field__label" }, "TMDB API Key (fallback)"),
          textField({
            value: settings.tmdbApiKey,
            placeholder: "free key from themoviedb.org",
            masked: true,
            onCommit: (v) => {
              updateSettings({ tmdbApiKey: v });
              onChange(getSettings());
            },
          }),
        ])
      : null;

    const wallpaperToggle = h("div", {
      class: `settings-toggle${settings.wallpaperMode === "shuffle" ? " is-on" : ""}`,
    });
    const wallpaperRow = h("div", { class: "settings-row" }, [
      h("span", {}, "Dashboard shuffle"),
      h(
        "button",
        {
          "data-focusable": "true",
          onclick: () => {
            updateSettings({
              wallpaperMode: settings.wallpaperMode === "shuffle" ? "off" : "shuffle",
            });
            onChange(getSettings());
            render();
          },
        },
        [wallpaperToggle]
      ),
    ]);

    // Each category gets independent Dashboard/Screensaver pills - some
    // images (e.g. with text baked in) read fine full-screen as a
    // screensaver but get covered/illegible behind the dashboard's UI and
    // scrim, or vice versa. Per-category, not per-image: with 36+ images,
    // individual toggles would be an impractical wall of controls.
    function categoryContextPill(category, contextLabel, settingsKey) {
      const enabledList = settings[settingsKey] ?? allCategories;
      const isEnabled = enabledList.includes(category);
      return h(
        "button",
        {
          class: `settings-context-pill${isEnabled ? " is-active" : ""}`,
          "data-focusable": "true",
          onclick: () => {
            const current = settings[settingsKey] ?? allCategories;
            const next = isEnabled
              ? current.filter((c) => c !== category)
              : [...current, category];
            updateSettings({ [settingsKey]: next });
            onChange(getSettings());
            render();
          },
        },
        contextLabel
      );
    }

    const allCategories = getCategories();
    const categoryTable =
      allCategories.length > 1
        ? h("div", {}, [
            h("div", { class: "settings-field__label" }, "Per-category: where each shows up"),
            h(
              "div",
              { class: "settings-category-table" },
              allCategories.map((category) =>
                h("div", { class: "settings-category-row" }, [
                  h("span", { class: "settings-category-row__label" }, formatCategoryLabel(category)),
                  h("div", { class: "settings-category-row__toggles" }, [
                    categoryContextPill(category, "Dashboard", "dashboardWallpaperCategories"),
                    categoryContextPill(category, "Screensaver", "screensaverWallpaperCategories"),
                  ]),
                ])
              )
            ),
          ])
        : null;

    const autoShiftToggle = h("div", {
      class: `settings-toggle${settings.oledPixelShiftAuto ? " is-on" : ""}`,
    });
    const oledRow = h("div", { class: "settings-row" }, [
      h("span", {}, "Auto pixel-shift (45s)"),
      h(
        "button",
        {
          "data-focusable": "true",
          onclick: () => {
            updateSettings({ oledPixelShiftAuto: !settings.oledPixelShiftAuto });
            onChange(getSettings());
            render();
          },
        },
        [autoShiftToggle]
      ),
    ]);
    const oledShiftNow = h(
      "button",
      { class: "settings-option", "data-focusable": "true", onclick: shiftPixelsOnce },
      "Shift now"
    );

    body.appendChild(
      group("appearance", "Appearance", [
        section("Home Layout", layoutOptions),
        section("Glass Theme", themeOptions),
      ])
    );
    body.appendChild(
      group("weather", "Weather", [cityOptions, weatherFxRow])
    );
    body.appendChild(group("apps", "Pinned Apps", [pinnedList]));
    body.appendChild(
      group("wallpaper", "Wallpaper & Screensaver", [
        wallpaperRow,
        categoryTable,
      ].filter(Boolean))
    );
    body.appendChild(
      group("hero", "Hero Content", [heroToggleRow, heroFields].filter(Boolean))
    );
    body.appendChild(group("display-care", "Display Care", [oledRow, oledShiftNow]));

    // -1 on the very first render (nothing was focused inside `body` yet -
    // open() positions initial focus itself, right after this returns).
    focusIndexWithin(body, focusIndex);
  }

  function open() {
    render();
    overlay.classList.add("is-open");
    setScope(drawer);
  }

  function close() {
    overlay.classList.remove("is-open");
    releaseScope();
  }

  function isOpen() {
    return overlay.classList.contains("is-open");
  }

  return { el: overlay, open, close, isOpen };
}
