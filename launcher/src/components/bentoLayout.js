import { h } from "../core/dom.js";
import { appTile } from "./appTile.js";
import { HERO_SLIDES, SPOTIFY_CONNECT, STREAM_INSIGHT } from "../data/demoContent.js";

export function bentoLayout(pinnedApps) {
  const slide = HERO_SLIDES[0];

  // Backdrop is its own layer (not .bento__hero's own `background`, which
  // would paint fully opaque and block the dashboard wallpaper behind it
  // entirely) so it can sit at reduced opacity above the glass-panel's
  // own translucent tint/blur and below the text - same z-index:-1
  // layering trick already used for the dashboard wallpaper stack (see
  // that component's own notes on why position:absolute alone isn't
  // enough: in-flow content paints above a z-index:auto positioned
  // sibling regardless of DOM order on this engine).
  const bentoHeroBackdrop = h("div", {
    class: "bento__hero-backdrop",
    style: { background: slide.backdrop },
  });
  const bentoHero = h("div", { class: "bento__hero glass-panel" }, [
    bentoHeroBackdrop,
    h("h2", { class: "heading" }, slide.title),
    h(
      "div",
      { class: "hero__meta" },
      slide.badges.map((b) => h("span", { class: "hero__badge" }, b))
    ),
  ]);

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
    pinnedApps.slice(0, 8).map((app) => appTile(app))
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
