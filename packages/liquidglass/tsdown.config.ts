import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  platform: "browser",
  dts: true,
  // Hooks and refs throughout: React Server Components must treat it as a client module.
  banner: { js: '"use client";' },
  copy: [{ from: "src/styles.css", to: "dist" }],
});
