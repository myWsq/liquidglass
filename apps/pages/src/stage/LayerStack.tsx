import { applyLens, createLensMap, type LiquidHandle } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useAtomValue } from "jotai";
import { useEffectEvent, useLayoutEffect, useRef, type RefObject } from "react";
import { LAYERS, type LayerKey } from "../layers";
import { DURATION, cardAtom, playbackAtom, readingAtom } from "../state";
import { PlayerFace } from "./PlayerFace";

interface Props {
  /** The layers page is open: fly out and explode. Otherwise fly home and land. */
  open: boolean;
  /** The stack is on screen (open, or still flying home). */
  shown: boolean;
  layer: LayerKey;
  liquid: RefObject<LiquidHandle | null>;
  /** Called once the stack has landed back on the card. */
  onLanded: () => void;
}

/** One trip, out or back, in ms. */
const TRIP = 1100;
/** How far apart the layers end up, px. */
const GAP = 40;
/** Opacity of the layers you aren't looking at. */
const DIM = 0.14;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** The part of the trip between `a` and `b`, eased. */
const phase = (p: number, a: number, b: number) => {
  const k = clamp01((p - a) / (b - a));
  return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
};

/**
 * The card, exploded into its six layers, with a hero transition. The stack takes
 * off as an exact copy of the card where it sits, glides to the middle, tilts back,
 * and only then pulls its layers apart; coming back runs the same timeline in
 * reverse and lands on the card. One progress value drives all of it, so reversing
 * mid-flight is seamless.
 *
 * The blur and lens panes are cut live from the liquid under the stack's current
 * footprint, and the lens is applied on the CPU with the same map the real glass
 * uses, so at both ends the copy matches the card.
 */
export function LayerStack({ open, shown, layer, liquid, onLanded }: Props) {
  const card = useAtomValue(cardAtom);
  const reading = useAtomValue(readingAtom);
  const { t, playing } = useAtomValue(playbackAtom);
  const root = useRef<HTMLDivElement>(null);
  const panes = useRef<(HTMLElement | null)[]>([]);
  const progress = useRef(0);
  const shade = useRef<number[]>(LAYERS.map(() => 1));

  const latest = useEffectEvent(() => ({ open, card, reading, layer, onLanded }));

  // A layout effect, and the first frame applied before paint: the card hides in the
  // same paint the stack appears in, already sitting exactly on top of it.
  useLayoutEffect(() => {
    if (!shown) {
      progress.current = 0;
      return;
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    let landed = false;

    const apply = (dt: number) => {
      const node = root.current;
      const stage = node?.parentElement;
      if (!node || !stage) return;
      const { open, card, reading, layer, onLanded } = latest();

      // Advance the one timeline toward where the page wants it.
      const target = open ? 1 : 0;
      const step = reduced ? 1 : dt / TRIP;
      const p = (progress.current =
        target > progress.current
          ? Math.min(target, progress.current + step)
          : Math.max(target, progress.current - step));
      if (!open && p === 0 && !landed) {
        landed = true;
        onLanded();
        return;
      }
      if (landed) return;

      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const home = card ?? { x: (W - w) / 2, y: (H - h) / 2 };
      const glide = phase(p, 0, 0.7);
      const tilt = phase(p, 0.15, 0.9);
      const apart = phase(p, 0.4, 1);
      const x = lerp(home.x, (W - w) / 2, glide);
      const y = lerp(home.y, (H - h) / 2, glide);

      node.style.transform =
        `translate3d(${x}px, ${y}px, 0) translateY(${14 * tilt}px) ` +
        `rotateX(${56 * tilt}deg) rotateZ(${-34 * tilt}deg) scale(${1 - 0.04 * tilt})`;

      const k = 1 - Math.exp(-dt / 110);
      panes.current.forEach((el, i) => {
        if (!el) return;
        const want = LAYERS[i].key === layer ? 1 : lerp(1, DIM, apart);
        shade.current[i] += (want - shade.current[i]) * (p === 1 || p === 0 ? k : 1);
        el.style.opacity = shade.current[i].toFixed(3);
        el.style.transform = `translateZ(${(i - 2.5) * GAP * apart}px)`;
      });

      // The tint and rim match the live card at the ends, the diagram in between.
      const lightInk = reading?.ink === "light";
      const tint = panes.current[3];
      if (tint) {
        const a = lerp(reading?.tint ?? 0.12, 0.3, apart);
        const c = lightInk ? [12, 16, 40].map((v) => lerp(v, 255, apart)) : [255, 255, 255];
        tint.style.backgroundColor = `rgb(${c.map(Math.round).join(" ")} / ${a.toFixed(3)})`;
      }
      const ink = panes.current[5];
      if (ink) {
        ink.style.setProperty(
          "--glass-ink",
          lightInk ? "rgb(255 255 255 / 94%)" : "rgb(0 0 0 / 86%)",
        );
        ink.style.setProperty(
          "--glass-ink-sub",
          lightInk ? "rgb(235 235 245 / 62%)" : "rgb(60 60 67 / 70%)",
        );
        ink.style.setProperty("--lg-ink-blend", lightInk ? "screen" : "multiply");
      }

      paintBackdrop(liquid.current, x, y, w, h, [
        panes.current[1] as HTMLCanvasElement | null,
        panes.current[2] as HTMLCanvasElement | null,
      ]);
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      apply(now - last);
      last = now;
    };
    apply(0);
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [shown, liquid]);

  const pane = (i: number) => (el: HTMLElement | null) => {
    panes.current[i] = el;
  };

  return (
    <div ref={root} aria-hidden="true" {...stylex.props(styles.stack, !shown && styles.off)}>
      <div ref={pane(0)} {...stylex.props(styles.pane, styles.shadow)} />
      <canvas ref={pane(1)} {...stylex.props(styles.pane)} />
      <canvas ref={pane(2)} {...stylex.props(styles.pane)} />
      <div ref={pane(3)} {...stylex.props(styles.pane, styles.tint)} />
      <div ref={pane(4)} {...stylex.props(styles.pane, styles.rim)} />
      <div ref={pane(5)} {...stylex.props(styles.pane, styles.ink)}>
        <PlayerFace t={t} duration={DURATION} playing={playing} />
      </div>
    </div>
  );
}

/** Cuts the liquid under the stack's footprint into the blur pane, and the lens pane. */
function paintBackdrop(
  handle: LiquidHandle | null,
  x: number,
  y: number,
  w: number,
  h: number,
  [blur, lens]: (HTMLCanvasElement | null)[],
) {
  const src = handle?.canvas;
  if (!handle || !src || !w || !h) return;
  const box = src.getBoundingClientRect();
  if (!box.width) return;
  const k = src.width / box.width;
  handle.draw();
  for (const cv of [blur, lens]) {
    if (!cv) continue;
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    const c = cv.getContext("2d", { willReadFrequently: true });
    if (!c) continue;
    c.filter = "blur(2px) saturate(1.8) brightness(1.06)";
    c.drawImage(src, x * k, y * k, w * k, h * k, 0, 0, w, h);
    if (cv === lens) {
      const map = createLensMap({ width: w, height: h, radius: 28 });
      c.putImageData(applyLens(c.getImageData(0, 0, w, h), map), 0, 0);
    }
  }
}

const styles = stylex.create({
  stack: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "clamp(290px, calc(100% - 40px), 380px)",
    transformStyle: "preserve-3d",
    pointerEvents: "none",
    willChange: "transform",
  },
  off: { visibility: "hidden" },
  pane: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    borderRadius: 28,
  },
  shadow: {
    boxShadow: "0 0 0 .5px rgb(0 0 0 / .06), 0 6px 24px rgb(0 0 0 / .08)",
  },
  tint: {
    boxShadow: "inset 0 0 0 .5px rgb(255 255 255 / .25)",
  },
  // The card's own rim light (05), so the stack lands on it without a seam.
  rim: {
    boxShadow:
      "inset 1.5px 1.5px 1px -1px #fff, inset -1.5px -1.5px 1px -1px rgb(255 255 255 / .55)",
    backgroundImage: "radial-gradient(at 0 0, rgb(255 255 255 / .3), transparent 55%)",
  },
  ink: {
    position: "relative",
    height: "auto",
    paddingBlock: "18px 14px",
    paddingInline: 20,
  },
});
