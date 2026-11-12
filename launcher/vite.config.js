import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

// webOS 4.x ships an old Chromium (commonly cited ~v53, 2016) with no native
// <script type="module"> support and no backdrop-filter. The legacy plugin
// emits a second, transpiled + polyfilled bundle behind <script nomodule>,
// so old TV hardware gets a build that actually runs, while modern browsers
// (this dev server, your desktop browser during testing) use the fast
// native-ESM build untouched. Verify the real engine version once this is
// running on the TV (navigator.userAgent via the Homebrew Channel's web
// inspector) and narrow/relax the target below if needed.
export default defineConfig({
  base: "./",
  build: {
    target: "es2015",
    outDir: "dist",
  },
  server: {
    host: true,
    port: 5173,
  },
  plugins: [
    legacy({
      targets: ["chrome >= 53", "safari >= 10"],
      modernPolyfills: true,
    }),
  ],
});
