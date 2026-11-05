# AGENTS.md

What an agent needs to maintain liquidglass that the code does not say on its own.

## Shape

- `packages/liquidglass` is the published npm package `@myna/liquidglass`. `apps/pages` (`@myna/liquidglass-pages`, private) is the demo site and the acceptance surface.
- The library ships **plain CSS** (`@myna/liquidglass/styles.css`) on purpose, not StyleX: a published component must not make its consumers adopt a styling system. StyleX and astryx are for `apps/pages` only. Never add them to the library.
- The public styling contract is the four `--glass-*` tokens (`tint`, `blur`, `lens`, `edge`) plus `--glass-ink` / `--glass-ink-sub`, the classes `liquidglass`, `liquidglass-ink`, `liquidglass-sub`, and `data-ink`. `--lg-*` properties are internal inputs and may change.

## Decisions to keep

- **Defaults come from the reference spec** in `wiki/research/liquid-glass-reference.md` (rim 44px, refraction 1.1, falloff 2.6, magnify 5%, dispersion ±15%, blur 2px / saturate 1.8 / brightness 1.06, wash 6–22%). Change them only deliberately, and update that page.
- **Ink hysteresis** is 0.47 → light, 0.53 → dark. A single 0.5 threshold flickers while the liquid moves.
- **Glass writes readings to the DOM, not to React state.** The backdrop is re-read about five times a second; re-rendering for that would be waste. Anything that must survive a render (`data-ink`, `--lg-tint-a`) is therefore _not_ passed as a prop when a backdrop is present.
- **The lens has two engines.** The SVG filter (`url()` inside `backdrop-filter`) only renders in Chromium; `supportsLens()` uses UA brands because `CSS.supports` only tests whether a value parses. Everywhere else, `lens="auto"` uses the canvas lens: the glass calls `backdrop.capture()` once per `backdrop.frame()`, refracts with `applyLens` on the CPU and lets CSS blur it. It sets `data-lens="canvas"` on the element only after the first successful capture, so a backdrop with nothing to hand over never covers the glass with an empty canvas.
- **Canvas mode moves the tint and rim light to `::after`.** Inset shadows and the element's own background paint _below_ a `z-index: -1` child, so they would vanish under the refraction canvas. `--lg-rim` holds the inset rim shadows so both places can use it. Glass in canvas mode forces `position: relative` if it was static.
- **Frame listeners run right after the engine draws**, while the WebGL buffer is still valid (`drawn` flag), so captures don't trigger extra full-screen draws.
- **The shader and its CPU twin must match.** `FRAG` and `shadeCPU` in `liquid-engine.ts` are the same function. The CPU one is the no-WebGL2 fallback. Edit both together, and compare a frame from each (see Acceptance).
- **A WebGL canvas is only readable in the task that drew it** (no `preserveDrawingBuffer`). Every read goes through `draw()` first: `sample()`, and the demo's `LiquidHandle.draw()` before `drawImage`.
- **`destroy()` must not lose the WebGL context.** React Strict Mode remounts on the same canvas and would get a dead context back.
- **The workspace export condition is `liquidglass-source`, not `source`.** astryx publishes a `source` condition too, and matching it compiles astryx from its TypeScript. Vite (`resolve.conditions`) and TypeScript (`customConditions`) both use the unique name.
- **Babel is pinned to 7** in `apps/pages`: `babel-plugin-react-compiler` pulls Babel 7 plugins. The React Compiler runs through `@rolldown/plugin-babel` + `reactCompilerPreset`, not the experimental native compiler.
- **React Compiler is on.** No manual `useMemo`/`useCallback`/`memo`. No ref reads or writes during render, or the compiler skips the component. Use `useEffectEvent` for latest-value callbacks.
- **The library is ESM-only with isolated declarations.** Exported values need explicit types (`tsc` enforces it).
- **The demo has two pages: Material (`/`, the four declarations plus the light/dark reading) and Layers (`/layers`).** `/light-and-dark` redirects to `/` for old links.
- **The layers transition is one JS-driven timeline, not CSS transitions.** A single progress value (0 = on the card, 1 = exploded) drives glide, tilt and separation in staggered phases, so reversing mid-flight is seamless, and the blur/lens panes are cut from the liquid under the stack's _current_ footprint. The card's position and its °C/°F choice live in atoms (`cardAtom`, `unitAtom`) so the stack starts and ends as a pixel-matched copy; the card hides with `visibility` (no fade) while the stack is shown, and the first frame is applied in a layout effect so there is no frame with neither. Keep the stack's rim, tint and ink panes matching the live card at progress 0.
- **The liquid has no pointer interaction.** Stirring was removed on purpose: the wallpaper only drifts.
- **The demo uses hash routing and `base: "./"`** so `apps/pages/dist` runs from any static host or subpath. It deploys to GitHub Pages (`.github/workflows/pages.yml`, https://mywsq.github.io/liquidglass/) on every push to `main`.
- **The demo's vendor code is split into `react`, `astryx` and `router` chunks** so they stay cached across deploys. astryx alone is ~150 kB gzipped; that is the baseline, not a regression to chase.
- **The library is a client module.** tsdown prepends `"use client"` so React Server Components (Next.js App Router) can import it.
- **npm and GitHub names differ.** The package is `@myna/liquidglass` (npm org `myna`, owned by `mywsq`); the repository is `myWsq/liquidglass` (the GitHub org `myna` belongs to someone else).

## Docs

- `README.md` at the root is the single source of user docs. `prepack` copies it (and `LICENSE`) into the package so npm shows it; the copies are gitignored.
- astryx component docs: `pnpm --filter @myna/liquidglass-pages astryx component <Name>`.

## Acceptance

There are no tests, by design. Accept changes by driving `pnpm dev` in Chrome:

1. `/`: the card's `backdrop-filter` ends in `url(#liquidglass-…)` and a `<filter>` exists at the card's size. The edge visibly bends the liquid. Switch the lens to Canvas: every glass gets `data-lens="canvas"`, still at ~60 fps.
2. Drag the card from a pale current to a deep one: the ink flips and the token readout follows.
3. Same page: the tint pill changes only the current appearance's multiplier (the readout shows which).
4. Sun/moon: the liquid cross-fades and the ink re-picks.
5. Drag the card off-centre, then open `/layers`: the stack appears on the card's exact pixels in the same frame the card hides, glides to the middle, tilts, then separates; ↑/↓ step layers. Back to `/`: it reverses and lands on the card before the card reappears. Record it with the DevTools screencast; sample `getBoundingClientRect()` per frame to check the first and last frames.
6. No console errors; about 60 fps (`requestAnimationFrame` count over 2 s).
7. For lens changes, also check real Safari: `open -a Safari http://localhost:5199/`, find the window id with `CGWindowListCopyWindowInfo` (a few lines of Swift), and `screencapture -l<id>`. Auto must pick Canvas there.
8. For engine changes, load with WebGL2 disabled (an `initScript` that makes `getContext("webgl2")` return `null`) and compare the still frame with the GPU frame.

## Tooling

- pnpm + turborepo; `packages/` is depended on, `apps/` depends.
- `pnpm fmt` (oxfmt, defaults) and `pnpm lint` (oxlint, defaults). `pnpm typecheck`, `pnpm build`.
- Releases: changesets in fixed mode, so every package shares one version. See `.agents/skills/release`.
