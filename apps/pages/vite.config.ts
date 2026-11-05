import babel from "@rolldown/plugin-babel";
import stylex from "@stylexjs/unplugin";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defaultClientConditions, defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths and hash routing: the build runs from any static host or subpath.
  base: "./",
  // `liquidglass-source` resolves the workspace library to their TypeScript, so edits to liquidglass hot-reload.
  resolve: { conditions: ["liquidglass-source", ...defaultClientConditions] },
  plugins: [stylex.vite(), react(), babel({ presets: [reactCompilerPreset()] })],
  build: {
    rolldownOptions: {
      output: {
        // The frameworks change rarely; keep them apart from the demo so they stay cached.
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            {
              name: "astryx",
              test: /node_modules[\\/](@astryxdesign|@formatjs|lucide-react)[\\/]/,
            },
            { name: "router", test: /node_modules[\\/](@tanstack|jotai)[\\/]/ },
          ],
        },
      },
    },
    // astryx alone is ~470 kB (150 kB gzipped): the baseline here, not a regression.
    chunkSizeWarningLimit: 700,
  },
});
