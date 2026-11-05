<div align="center">

# liquidglass

**Liquid glass for React.**
<br />
A rim that bends the light, a line where it catches, and ink that reads the wallpaper.

[![npm](https://img.shields.io/npm/v/@myna/liquidglass?color=3a7cf0&label=npm)](https://www.npmjs.com/package/@myna/liquidglass)
[![minzipped](https://img.shields.io/badge/minzipped-10%20kB-3a7cf0)](./packages/liquidglass)
[![license](https://img.shields.io/badge/license-MIT-3a7cf0)](./LICENSE)

<a href="https://mywsq.github.io/liquidglass/"><img src="https://raw.githubusercontent.com/myWsq/liquidglass/main/assets/hero.jpg" alt="A glass weather widget floating over a flowing blue liquid; the wallpaper bends at its edge." width="100%" /></a>

**[Live demo](https://mywsq.github.io/liquidglass/)** · [npm](https://www.npmjs.com/package/@myna/liquidglass) · [GitHub](https://github.com/myWsq/liquidglass)

</div>

<br />

Most "glass" on the web is a blur with a white wash. Real glass does something a blur
can't: it **bends what's behind it**, hardest at the edge, and splits a little colour
there. liquidglass gives any React element that rim, plus the five layers that make it
read as a material, and lets it look at the wallpaper behind it to choose its own ink.

```tsx
import { Glass } from "@myna/liquidglass";
import "@myna/liquidglass/styles.css";

<Glass>Hello, glass.</Glass>;
```

## Install

```sh
npm install @myna/liquidglass
```

React 19.2 or newer. No build plugin, no styling system to adopt: one component, one
stylesheet. It ships as a client module (`"use client"`), so it drops straight into a
Next.js App Router page.

## Quick start

Put glass on top of anything. Inside a `<Liquid>`, it reads the flowing wallpaper
under it and keeps its text legible as the currents pass.

```tsx
import { Glass, Ink, Liquid } from "@myna/liquidglass";
import "@myna/liquidglass/styles.css";

export function App() {
  return (
    <Liquid theme="light" style={{ height: "100vh" }}>
      <Glass as="section" style={{ width: 380, padding: 20 }}>
        <Ink as="h2">Kyoto · 23°</Ink>
        <Ink as="p" tone="secondary">
          Partly cloudy, H:26° L:17°
        </Ink>
      </Glass>
    </Liquid>
  );
}
```

`<Ink>` is the material's ink, in two strengths: `tone="primary"` (the default) and
`tone="secondary"`. It follows the glass around it, dark on light glass and light on
dark glass, and blends in, so text takes on a little of the colour behind it.

## The material

Six layers on one element, on any wallpaper, light or dark.

| Layer               | What it does                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **01 Shadow**       | Lifts the card off the wallpaper, faintly: the rim does most of the work.                                                                       |
| **02 Blur & light** | `blur(2px) saturate(1.8) brightness(1.06)`. Softens what is behind just a little and deepens its colours, so the glass stays clear.             |
| **03 Rim lens**     | A thick slab: a 44px rim bends the wallpaper hard at the edge and eases off inward, the middle magnifies a little, red bends further than blue. |
| **04 Tint**         | A thin wash, 6–22%, thicker over busy wallpaper so text holds. The colour comes from behind.                                                    |
| **05 Rim light**    | A bright line where the light hits the top left, a softer one at the bottom right, a glow just inside.                                          |
| **06 Ink**          | One ink in two strengths, blended into the glass. Dark over bright backdrops, light over dim ones.                                              |

All of it compiles down to four declarations. Use them on your own elements, too:

```css
.my-card {
  background: var(--glass-tint);
  backdrop-filter: var(--glass-blur) var(--glass-lens);
  box-shadow: var(--glass-edge);
  color: var(--glass-ink);
}
```

Outside React, inside an element styled this way, the classes `liquidglass-ink` and
`liquidglass-sub` do what `<Ink>` and `<Ink tone="secondary">` do.

## How the rim bends

For every pixel, liquidglass takes `d`, the distance to the rounded edge, and looks inward
by

```
offset = refraction × rim × (1 − d / rim) ^ falloff   +   magnify × (distance to the centre)
```

Red, green and blue are displaced by `1 + dispersion`, `1` and `1 − dispersion`, which
splits colour at the rim. The map is rebuilt whenever the element changes size, and
cached by size. It runs one of two ways:

- **Filter** (Chromium). The offsets become an image for an SVG `feDisplacementMap`,
  applied with `backdrop-filter: url(#…)`. It bends whatever is behind the glass.
- **Canvas** (every other browser). Over `<Liquid>`, the liquid bends itself under
  each glass in its own WebGL pass: same map, colour split, blur, saturate and
  brightness, inside the glass's rounded rect. Nothing is copied or read back. Over a
  `<Backdrop>` with `capture`, glass copies the pixels and bends them on the CPU
  instead. Either way the tint and rim light move to `::after` so they stay on top.

`lens="auto"` picks the filter where it runs and the canvas elsewhere. Glass over
ordinary page content in Safari or Firefox has no pixels to copy, so it keeps every
layer except the lens.

## Reading the wallpaper

CSS can't see the pixels behind an element, so glass asks its backdrop. `<Liquid>`
answers for you. For a wallpaper of your own, wrap it in `<Backdrop>`:

```tsx
import { Backdrop, Glass, canvasCapture, canvasSampler } from "@myna/liquidglass";

<Backdrop sample={canvasSampler(myCanvas)} capture={canvasCapture(myCanvas)} interval={200}>
  <Glass ink="auto">…</Glass>
</Backdrop>;
```

A sampler is any function from a viewport rectangle to `{ luminance, busyness }`, both
0–1. Glass switches to light ink below 0.47 and back above 0.53, so it never flickers on
the boundary, and raises its wash as `busyness` grows. `capture` is optional: it hands
the pixels over so the canvas lens can refract them outside Chromium.

## API

### `<Glass>`

Renders a `div` by default; pass `as` for any other element, and its props come along.

| Prop                               | Default              | Description                                                                    |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `as`                               | `"div"`              | Element or component to render.                                                |
| `radius`                           | `28`                 | Corner radius in px, or `"pill"`.                                              |
| `rim`                              | `44`                 | Width of the refracting band, px.                                              |
| `refraction`                       | `1.1`                | How far the rim reaches inward, × `rim`.                                       |
| `falloff`                          | `2.6`                | How quickly the bend eases off away from the edge.                             |
| `magnify`                          | `0.05`               | Pull toward the middle.                                                        |
| `dispersion`                       | `0.15`               | Colour split at the rim.                                                       |
| `blur` · `saturate` · `brightness` | `2` · `1.8` · `1.06` | The backdrop filter.                                                           |
| `tint`                             | `"auto"`             | Wash 0–1 or `"auto"` (6–22% by busyness), or `{ light, dark }` per appearance. |
| `tintScale`                        | `1`                  | Multiplier on the wash: a number, or `{ light, dark }` per appearance.         |
| `ink`                              | `"auto"`             | `"dark"`, `"light"`, or chosen from the backdrop.                              |
| `lens`                             | `"auto"`             | `"filter"`, `"canvas"`, `false`, or the best one this browser can run.         |
| `onReading`                        |                      | `({ luminance, busyness, ink, tint }) => void`, each time the glass reads.     |

### `<Ink>`

Text or icons in the glass's ink. Renders a `span` by default; pass `as` for any other
element, and its props come along.

| Prop   | Default     | Description                                               |
| ------ | ----------- | --------------------------------------------------------- |
| `as`   | `"span"`    | Element or component to render.                           |
| `tone` | `"primary"` | `"primary"` for text that leads, `"secondary"` beside it. |

### `<Liquid>`

A flowing liquid wallpaper drawn by a WebGL2 shader; the currents drift on their own. Glass
inside reads it.

| Prop          | Default   | Description                                                              |
| ------------- | --------- | ------------------------------------------------------------------------ |
| `theme`       | `"light"` | Cross-fades between the light and dark palettes.                         |
| `colors`      |           | `{ light?, dark? }`: override `deep mid pale warm env spec`.             |
| `speed`       | `1`       | Flow speed multiplier.                                                   |
| `scale`       | `3.4`     | How many currents fit on screen.                                         |
| `bump`        | `0.05`    | How wet and three-dimensional the surface looks.                         |
| `paused`      | `false`   | Freeze the flow.                                                         |
| `resolution`  | `0.75`    | Render resolution as a fraction of device pixels.                        |
| `canvasProps` |           | `className` and `style` for the canvas, e.g. to blur it behind a dialog. |
| `ref`         |           | `{ canvas, live, draw(), sample(rect) }`.                                |

### Lens utilities

`createLensMap({ width, height, radius, rim?, refraction?, falloff?, magnify? })` returns
the displacement map as offsets and a data URL. `refract(ctx, sourceCanvas, rect, map)`
bends part of a canvas into a 2D canvas on the GPU, and `applyLens(imageData, map)` does
the same on the CPU, for snapshots and diagrams. `supportsLens()` tells you whether the
browser can run it as a filter.

### `<Backdrop>`

`sample` (required), `capture`, and `interval` (ms between re-reads, default 200).
`canvasSampler(canvas)` and `canvasCapture(canvas)` build the first two for a canvas.
`useBackdrop()` returns the nearest backdrop source, for your own components.

## Browser support

|                             | Chrome · Edge | Safari · Firefox |
| --------------------------- | ------------- | ---------------- |
| Blur, tint, rim light, ink  | ✓             | ✓                |
| Rim lens over `<Liquid>`    | ✓ filter      | ✓ canvas         |
| Rim lens over other content | ✓ filter      | blur only        |
| `<Liquid>`                  | ✓             | ✓                |

Without WebGL2, `<Liquid>` renders one still frame of the same liquid on the CPU. With
`prefers-reduced-motion`, it holds still.

## Performance

Measured in Chrome on the demo (four pieces of glass on a full-height `<Liquid>`), with
the CPU slowed 4× to stand in for a slower machine: 60 fps throughout, with 0.7 ms of
JavaScript per frame on the filter lens, 2.8 ms on the canvas lens and 4 ms in the
exploded layer view. The filter lens costs the main thread almost nothing; the work is
the GPU's. A few things keep it that way:

- The liquid is one full-screen shader, rendered at 0.75× device pixels (`resolution`
  to trade sharpness for GPU time). It stops drawing while scrolled out of view, and
  in hidden tabs.
- Glass reads its backdrop (for ink and wash) from one small thumbnail of the liquid,
  a few times a second, shared by every glass.
- The canvas lens bends the liquid inside the liquid's own WebGL pass, with no copies.
  Copying the frame out per glass cost Safari a third of its frame rate.

## The demo

[The demo](https://mywsq.github.io/liquidglass/) is `apps/pages`: a glass weather widget
on the liquid. Beside it, the card as `<Glass>` code with its live props, the tokens
underneath, and the light/dark reading. The layers button in the corner pulls the card
apart into its six layers, each labelled where it sits.

```sh
pnpm install
pnpm dev
```

## License

[MIT](./LICENSE)
