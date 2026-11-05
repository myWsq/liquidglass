# Liquid glass: the reference spec

liquidglass started from a short screen recording that explains a web liquid-glass material
in three parts. It shows a music player card ("Glass Hours · The Lumno Band") over a blue
wallpaper. This page records what it specified, because the library's defaults trace back
to it.

## 00 Four declarations

> Any component turns to glass by trading four declarations for the material's tokens.

```css
.player {
  background: var(--glass-tint);
  backdrop-filter: var(--glass-blur) var(--glass-lens);
  box-shadow: var(--glass-edge);
  color: var(--glass-ink);
}
```

## 01 Six layers

| Layer        | Spec                                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shadow       | `0 0 0 .5px rgb(0 0 0 / .06), 0 6px 24px rgb(0 0 0 / .08)`. "The rim does most of the work."                                                              |
| Blur & light | `blur(2px) saturate(1.8) brightness(1.06)`                                                                                                                |
| Rim lens     | `url(#lens)`. A wide 44px rim; `offset = 1.1 × rim × (1 − d/rim)^2.6 + 5% toward the middle`; red ×1.15, green ×1, blue ×0.85.                            |
| Tint         | `rgb(255 255 255 / 6%–22%)`, "thicker over busy wallpaper so the text holds."                                                                             |
| Rim light    | `inset 1.5px 1.5px 1px -1px #fff, inset -1.5px -1.5px 1px -1px rgb(255 255 255 / .55)`, `radial-gradient(at 0 0, rgb(255 255 255 / .3), transparent 55%)` |
| Ink          | `rgb(0 0 0 / 86%)`, `.sub` `rgb(60 60 67 / 70%)`, `mix-blend-mode: multiply`                                                                              |

## 02 Light & dark

> The card reads the wallpaper under it and picks its ink. The tint's strength is kept
> apart for light and dark.

The video's readout showed luminance 0.68 → dark ink and 0.29 → light ink ("light below
0.5"), and a tint slider with separate multipliers per theme (e.g. light ×0.05 · dark ×0.80).

## Where liquidglass goes beyond it

- **Ink hysteresis** (0.47 / 0.53) instead of a hard 0.5, because the backdrop moves.
- **Light ink inverts the material:** night tint `rgb(12 16 40)`, `screen` blend, and a dimmer rim light.
- **The wallpaper.** The video used a still silk-and-clouds image. liquidglass ships `<Liquid>`, a flowing glossy liquid shader the glass can read, at the owner's request ("more like a liquid").
- **"Busy"** is measured as the standard deviation of luminance under the element, mapped from 0.04–0.30 onto the 6–22% wash.
