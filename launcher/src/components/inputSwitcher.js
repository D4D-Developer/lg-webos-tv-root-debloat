import { h, clear } from "../core/dom.js";
import { launchApp } from "../core/platform.js";
import { getDiscoveredApps } from "../core/icons.js";
import { getInputSources } from "../data/inputs.js";
import { glyphIcon } from "./iconGlyph.js";
import { setScope, releaseScope } from "../core/navigation.js";

// A header dropdown, not a Settings entry - this is meant to be a quick,
// one-step change, not something buried behind opening a whole drawer.
// `onBeforeOpen` lets main.js close the Settings drawer first if it's
// open, since both use the same navigation.js focus-scope singleton and
// only one modal-ish surface should own it at a time.
export function createInputSwitcher({ onBeforeOpen } = {}) {
  const list = h("div", { class: "input-switcher__list" });
  const panel = h("div", { class: "input-switcher__panel glass-panel" }, [list]);

  const toggleBtn = h(
    "button",
    {
      class: "pill pill--button glass-panel",
      "data-focusable": "true",
      onclick: () => (isOpen() ? close() : openFromButton()),
    },
    [glyphIcon("tv", { class: "pill__icon" }), h("span", {}, "Input")]
  );

  const el = h("div", { class: "input-switcher" }, [toggleBtn, panel]);

  function renderList() {
    clear(list);
    const inputs = getInputSources(getDiscoveredApps());
    if (inputs.length === 0) {
      list.appendChild(
        h("div", { class: "input-switcher__empty" }, "No inputs detected on this TV yet")
      );
      return;
    }
    inputs.forEach((input) => {
      list.appendChild(
        h(
          "button",
          {
            class: "input-switcher__item",
            "data-focusable": "true",
            onclick: () => {
              launchApp(input);
              close();
            },
          },
          input.label
        )
      );
    });
  }

  function openFromButton() {
    onBeforeOpen?.();
    open();
  }

  function open() {
    renderList();
    panel.classList.add("is-open");
    setScope(panel);
  }

  function close() {
    panel.classList.remove("is-open");
    releaseScope();
  }

  function isOpen() {
    return panel.classList.contains("is-open");
  }

  return { el, open, close, isOpen };
}
