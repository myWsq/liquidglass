# @myna/liquidglass

## 0.2.0

### Minor Changes

- bc6b153: First release of liquid glass for React.

  - `<Glass>`: shadow, blur and light, a refracting rim lens, tint, rim light, and ink that reads the backdrop.
  - The rim lens runs as an SVG filter in Chromium and as a canvas everywhere else (`lens="auto" | "filter" | "canvas" | false`).
  - `<Liquid>`: a flowing liquid wallpaper (WebGL2, with a still CPU fallback) that glass inside can read and refract.
  - `<Backdrop>`, `canvasSampler` and `canvasCapture` make any wallpaper readable.
  - Ships as a client module, so it works in React Server Components apps.
