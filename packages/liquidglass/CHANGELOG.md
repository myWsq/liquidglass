# @myna/liquidglass

## 0.2.0

### Minor Changes

- bc6b153: First release of liquid glass for React.

  - `<Glass>`: shadow, blur and light, a refracting rim lens, tint, rim light, and ink that reads the backdrop.
  - `tint` is `"auto"` (follows how busy the backdrop is), a fixed wash, or `{ light, dark }` to set light and dark glass apart, each side auto or fixed.
  - The rim lens runs as an SVG filter in Chromium and as a canvas everywhere else (`lens="auto" | "filter" | "canvas" | false`).
  - `<Liquid>`: a flowing liquid wallpaper (WebGL2, with a still CPU fallback) that glass inside can read and refract.
  - `<Backdrop>`, `canvasSampler` and `canvasCapture` make any wallpaper readable.
  - Ships as a client module, so it works in React Server Components apps.
  - Fast: the canvas lens bends the liquid in its own WebGL pass (no read-backs), readings share one thumbnail, and the liquid pauses while offscreen.
