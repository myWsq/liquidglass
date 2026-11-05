# @myna/liquidglass

## 0.3.0

### Minor Changes

- Faster everywhere, a calmer liquid, and tint per appearance.

  - **Breaking:** `<Liquid>` no longer reacts to the pointer; the currents only drift. The `stir` prop is removed.
  - `tint` also takes `{ light, dark }`, so light glass (dark ink) and dark glass (light ink) can each be `"auto"` or a fixed wash.
  - The canvas lens (every browser but Chromium) bends `<Liquid>` inside the liquid's own WebGL pass instead of copying its pixels out per glass. In Safari the demo went from 38 to 60 fps. Custom backdrops can do the same through the new `BackdropSource.refract`.
  - Glass reads its backdrop from one small thumbnail shared by all glass, instead of a full read-back per glass.
  - `<Liquid>` stops drawing while scrolled out of view.
  - New `refract()` and `supportsGPULens()` bend part of a canvas on the GPU, for snapshots and diagrams.
  - `supportsLens()` now detects Chromium when the user-agent brands are empty.

## 0.2.0

### Minor Changes

- bc6b153: First release of liquid glass for React.

  - `<Glass>`: shadow, blur and light, a refracting rim lens, tint, rim light, and ink that reads the backdrop.
  - The rim lens runs as an SVG filter in Chromium and as a canvas everywhere else (`lens="auto" | "filter" | "canvas" | false`).
  - `<Liquid>`: a flowing liquid wallpaper (WebGL2, with a still CPU fallback) that glass inside can read and refract. Moving the pointer stirs it (`stir`).
  - `<Backdrop>`, `canvasSampler` and `canvasCapture` make any wallpaper readable.
  - Ships as a client module, so it works in React Server Components apps.
