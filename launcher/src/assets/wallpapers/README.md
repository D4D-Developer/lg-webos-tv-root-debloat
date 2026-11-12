# Wallpapers

Drop image files in subfolders of this directory, one subfolder per
category (e.g. `cars/`, `nature-city/`, `comic/`) — `core/wallpapers.js`
auto-discovers everything recursively via Vite's `import.meta.glob` at
build time. No manifest file to edit; just add/remove files or whole
subfolders and reload/rebuild. The subfolder name becomes the category name
shown in Settings -> Wallpaper, where each category can be toggled on/off
independently for the shuffle.

- Formats: `.jpg`, `.jpeg`, `.png`, `.webp`
- Recommended size: around 1920x1080. Bigger doesn't look any better on this
  TV's actual resolution, it just bloats the bundle and slows the load —
  some of the current images are several MB each, worth compressing/
  resizing at some point before a real TV deploy.
- These get shipped inside the built app (`npm run build`), so only use
  images you have the right to redistribute — e.g. your own photos, or
  stock images whose license allows bundling with an app (Unsplash/Pexels/
  Pixabay-style "free to use" licenses are typically fine; a random image
  you found via search usually is not).

They're combined with the built-in generated gradient wallpapers (shown as
the "Default (generated)" category in Settings) and shuffled across the
dashboard background and the OLED Sleep screensaver.

This file is just documentation - it won't be picked up as a wallpaper
(glob only matches image extensions).
