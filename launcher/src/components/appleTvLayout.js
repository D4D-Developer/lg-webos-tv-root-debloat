import { h, clear } from "../core/dom.js";
import { appRow } from "./appTile.js";
import { HERO_SLIDES as DEMO_SLIDES } from "../data/demoContent.js";

const HERO_ROTATE_MS = 9000;
const CONTENT_SWAP_MS = 280; // shorter than the backdrop's own crossfade

// Soft blurred color blobs behind a *generated* (non-real) slide's base
// gradient - the "layered SVG atmosphere". Only used for demo slides; a
// real Plex/TMDB photo doesn't need a fake nebula behind it. SVG
// <feGaussianBlur> (not CSS filter/backdrop-filter) is used deliberately:
// it's supported in even very old Chromium builds, unlike the CSS blur
// properties the rest of this app has to work around for webOS 4.x. filter
// ids are per-slide so multiple stacked backdrops never collide.
function atmosphereSvg(index, glowA, glowB) {
  const blurId = `hero-atm-blur-${index}`;
  return `
    <svg class="hero__atmosphere" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id="${blurId}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="90" />
        </filter>
      </defs>
      <circle cx="420" cy="260" r="260" fill="${glowA}" opacity="0.5" filter="url(#${blurId})" />
      <circle cx="1180" cy="620" r="320" fill="${glowB}" opacity="0.4" filter="url(#${blurId})" />
    </svg>
  `;
}

function heroSpotlight() {
  let slides = DEMO_SLIDES;
  let active = 0;
  let backdropEls = [];
  let rotateTimer = null;

  const badgesEl = h("div", { class: "hero__meta" });
  const titleEl = h("h1", { class: "heading-lg" }, "");
  const ctaLabel = h("span", {}, "Resume");
  const nextUpLabel = h("span", {}, "");
  const nextUpBtn = h("button", { class: "hero__next-up glass-panel", "data-focusable": "true" }, [
    h("span", {}, "Next Up"),
    nextUpLabel,
  ]);
  const dotsEl = h("div", { class: "hero__dots" });

  const content = h("div", { class: "hero__content" }, [
    badgesEl,
    titleEl,
    h("div", { class: "hero__actions" }, [
      h("button", { class: "hero__cta glass-panel", "data-focusable": "true" }, [
        h("span", {}, "▶"),
        ctaLabel,
      ]),
      nextUpBtn,
    ]),
  ]);

  const backdropStack = h("div", { class: "hero__backdrop-stack" });
  const scrim = h("div", { class: "hero__scrim" });
  const el = h("div", { class: "hero" }, [backdropStack, scrim, content, dotsEl]);

  function buildBackdrops() {
    clear(backdropStack);
    backdropEls = slides.map((slide, i) => {
      const art = h("div", { class: "hero__backdrop-art" });
      if (slide.imageUrl) {
        // Real Plex/TMDB art: a photo, so skip the synthetic atmosphere -
        // it'd look like noise over a real image.
        art.style.backgroundImage = `url("${slide.imageUrl}")`;
        art.style.backgroundSize = "cover";
        art.style.backgroundPosition = "center";
        art.style.transformOrigin = "center";
      } else {
        art.style.background = slide.backdrop;
        art.style.transformOrigin = slide.kenBurnsOrigin || "center";
        art.innerHTML = atmosphereSvg(i, slide.glowA, slide.glowB);
      }
      const backdrop = h("div", { class: `hero__backdrop${i === 0 ? " is-active" : ""}` }, [art]);
      backdropStack.appendChild(backdrop);
      return backdrop;
    });
  }

  function paintContent(slide) {
    titleEl.textContent = slide.title;
    badgesEl.innerHTML = "";
    (slide.badges || []).forEach((b) => badgesEl.appendChild(h("span", { class: "hero__badge" }, b)));
    ctaLabel.textContent = slide.progressPct > 0 ? "Resume" : "Play";
    nextUpBtn.style.display = slide.nextUp ? "" : "none";
    nextUpLabel.textContent = slide.nextUp || "";
    dotsEl.innerHTML = "";
    slides.forEach((_, i) => {
      dotsEl.appendChild(h("span", { class: `hero__dot${i === active ? " is-active" : ""}` }));
    });
  }

  function goToSlide(nextIndex) {
    if (nextIndex === active) return;
    backdropEls[active].classList.remove("is-active");
    backdropEls[nextIndex].classList.add("is-active");
    content.classList.add("is-transitioning");
    setTimeout(() => {
      active = nextIndex;
      paintContent(slides[active]);
      content.classList.remove("is-transitioning");
    }, CONTENT_SWAP_MS);
  }

  function restartRotation() {
    if (rotateTimer) clearInterval(rotateTimer);
    active = 0;
    buildBackdrops();
    paintContent(slides[0]);
    if (slides.length > 1) {
      rotateTimer = setInterval(() => goToSlide((active + 1) % slides.length), HERO_ROTATE_MS);
    }
  }

  // Swaps in a new slide list (real content resolving after Plex/TMDB
  // fetches, or falling back to demo content again) - a no-op on an empty/
  // missing list rather than leaving the hero blank.
  function setSlides(newSlides) {
    if (!newSlides || newSlides.length === 0) return;
    slides = newSlides;
    restartRotation();
  }

  restartRotation();

  return { el, setSlides };
}

export function appleTvLayout(pinnedApps) {
  const hero = heroSpotlight();
  const el = h("div", { class: "layout-root", "data-layout": "apple-tv" }, [
    hero.el,
    appRow(pinnedApps),
  ]);
  // No telemetry shown in this layout; updateTelemetry is kept as a no-op
  // so main.js can call it uniformly on whichever layout is active.
  return { el, updateTelemetry: () => {}, updateHeroSlides: hero.setSlides };
}
