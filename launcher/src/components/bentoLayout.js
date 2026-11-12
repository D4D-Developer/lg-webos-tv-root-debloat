import { h } from "../core/dom.js";
import { appTile } from "./appTile.js";
import { HERO_SLIDES, SPOTIFY_CONNECT, STREAM_INSIGHT } from "../data/demoContent.js";

export function bentoLayout(pinnedApps) {
  const slide = HERO_SLIDES[0];

  const bentoHero = h(
    "div",
    { class: "bento__hero glass-panel", style: { background: slide.backdrop } },
    [
      h("h2", { class: "heading" }, slide.title),
      h(
        "div",
        { class: "hero__meta" },
        slide.badges.map((b) => h("span", { class: "hero__badge" }, b))
      ),
    ]
  );

  const spotifyCard = h("div", { class: "bento__spotify glass-panel" }, [
    h("span", {}, "🎵"),
    h("div", {}, [
      h("div", { style: { fontWeight: "600" } }, SPOTIFY_CONNECT.track),
      h("div", { class: "text-muted" }, SPOTIFY_CONNECT.artist),
    ]),
  ]);

  const grid = h(
    "div",
    { class: "bento__grid" },
    pinnedApps.slice(0, 8).map((app) => appTile(app, { showLabel: false }))
  );

  const insightWeather = h("span", {}, "—");
  const insightBar = h("div", { class: "bento__insight glass-panel" }, [
    insightWeather,
    h("span", { class: "text-muted" }, `${STREAM_INSIGHT.label}: ${STREAM_INSIGHT.value}`),
  ]);

  const el = h("div", { class: "layout-root", "data-layout": "bento" }, [
    h("div", { class: "bento__left" }, [bentoHero, spotifyCard]),
    h("div", { class: "bento__right" }, [grid, insightBar]),
  ]);

  function updateTelemetry(data) {
    insightWeather.textContent =
      data.tempC != null ? `${data.weatherIcon} ${data.tempC}° ${data.city}` : `❔ ${data.city}`;
  }

  return { el, updateTelemetry };
}
