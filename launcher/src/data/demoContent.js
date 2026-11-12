// Placeholder "what's on" content for the hero spotlight/bento cards.
// There's no content API wired up (would need a real catalog/watch-
// history source) - this is demo data purely to validate the UI/UX, and
// should be swapped for something real if this goes further.

// `glowA`/`glowB` tint the blurred SVG atmosphere layers; `kenBurnsOrigin`
// is the transform-origin the slow zoom drifts away from/toward - varying
// it per slide gives each backdrop a different apparent pan direction
// despite the animation itself only ever using `transform: scale()`.
export const HERO_SLIDES = [
  {
    title: "Nimbus",
    badges: ["Dolby Vision", "Atmos"],
    backdrop: "linear-gradient(135deg, #1e293b 0%, #0b0d12 70%)",
    glowA: "#2563eb",
    glowB: "#64748b",
    kenBurnsOrigin: "35% 30%",
    progressPct: 42,
    nextUp: "S2 E4 · Static Horizon",
  },
  {
    title: "Harbor Lights",
    badges: ["4K HDR", "Atmos"],
    backdrop: "linear-gradient(135deg, #3b1d1d 0%, #120d0a 70%)",
    glowA: "#f97316",
    glowB: "#7f1d1d",
    kenBurnsOrigin: "65% 70%",
    progressPct: 0,
    nextUp: "S1 E1 · Pilot",
  },
  {
    title: "Quiet Signal",
    badges: ["Dolby Vision"],
    backdrop: "linear-gradient(135deg, #1a1f3b 0%, #050505 70%)",
    glowA: "#6366f1",
    glowB: "#1e1b4b",
    kenBurnsOrigin: "50% 60%",
    progressPct: 78,
    nextUp: "S3 E9 · Last Frequency",
  },
];

export const SPOTIFY_CONNECT = {
  track: "Midnight Static",
  artist: "Low Orbit",
  isPlaying: false,
};

export const STREAM_INSIGHT = {
  label: "This week",
  value: "6h 42m watched",
};
