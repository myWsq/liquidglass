import { applyLens, createLensMap, type LiquidHandle } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useAtomValue } from "jotai";
import { useEffectEvent, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { LAYERS, type LayerKey } from "../layers";
import { cardAtom, readingAtom, unitAtom } from "../state";
import { WeatherFace } from "./WeatherFace";

type Point = { x: number; y: number };

interface Props {
  /** Pull the card apart. Otherwise put it back together, in the middle of the stage. */
  open: boolean;
  /** The stack is on screen (open, or still on its way back). */
  shown: boolean;
  liquid: RefObject<LiquidHandle | null>;
  /** Called once the stack has landed; the card takes over at `at`. */
  onLanded: (at: Point) => void;
}

/** One trip, out or back, in ms. */
const TRIP = 950;
/** How far apart the layers end up, px. */
const GAP = 60;
/** Opacity of the other layers while you point at one label. */
const DIM = 0.14;
/** Room the labels need on each side of the stack, px; below `WIDE` they drop their captions. */
const LABELS = { wide: 210, narrow: 96 };
const WIDE = 720;
/** Labels alternate sides, top layer on the right, so neither side gets crowded. */
const side = (i: number): "left" | "right" =>
  (LAYERS.length - 1 - i) % 2 === 0 ? "right" : "left";
/** Least vertical distance between two labels on the same side, px. */
const SPACING = 64;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** The part of the trip between `a` and `b`, eased (in-out sine: it gets going at once). */
const phase = (p: number, a: number, b: number) => {
  const k = clamp01((p - a) / (b - a));
  return (1 - Math.cos(Math.PI * k)) / 2;
};

/**
 * The card, pulled apart into its six layers, each one labelled where it is. The
 * stack takes off as an exact copy of the card, glides to the middle, tilts back and
 * only then separates; the labels draw in last. Putting it back runs the same
 * timeline in reverse, and it lands in the middle of the stage, where the card picks
 * up. One progress value drives all of it, so reversing mid-flight is seamless.
 *
 * The blur and lens panes are cut live from the liquid under the stack's current
 * footprint, and the lens is applied on the CPU with the same map the real glass
 * uses, so at both ends the copy matches the card.
 */
export function LayerStack({ open, shown, liquid, onLanded }: Props) {
  const card = useAtomValue(cardAtom);
  const reading = useAtomValue(readingAtom);
  const unit = useAtomValue(unitAtom);
  const [focus, setFocus] = useState<LayerKey | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const panes = useRef<(HTMLElement | null)[]>([]);
  const anchors = useRef<(HTMLElement | null)[]>([]);
  const labels = useRef<(HTMLElement | null)[]>([]);
  const leaders = useRef<(SVGGElement | null)[]>([]);
  const progress = useRef(0);
  const shade = useRef<number[]>(LAYERS.map(() => 1));

  const latest = useEffectEvent(() => ({ open, card, reading, focus, onLanded }));

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
    let home: Point | null = null;

    const apply = (dt: number) => {
      const node = root.current;
      const stage = node?.parentElement;
      if (!node || !stage) return;
      const { open, card, reading, focus, onLanded } = latest();

      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const middle = { x: (W - w) / 2, y: (H - h) / 2 };

      // Advance the one timeline toward where the page wants it.
      const target = open ? 1 : 0;
      const step = reduced ? 1 : dt / TRIP;
      const p = (progress.current =
        target > progress.current
          ? Math.min(target, progress.current + step)
          : Math.max(target, progress.current - step));
      if (!open && p === 0 && !landed) {
        landed = true;
        const wall = liquid.current?.canvas;
        if (wall) {
          wall.style.filter = "";
          wall.style.transform = "";
        }
        onLanded(middle);
        return;
      }
      if (landed) return;

      // Take off from the card; head home to the middle. Easing `home` keeps a reversal
      // mid-flight from jumping.
      const want = open ? (card ?? middle) : middle;
      home ??= want;
      const ease = reduced ? 1 : 1 - Math.exp(-dt / 180);
      home = { x: lerp(home.x, want.x, ease), y: lerp(home.y, want.y, ease) };

      // Make room for the labels on both sides, and shrink the stack if the stage is narrow.
      const room = W >= WIDE ? LABELS.wide : LABELS.narrow;
      const scale = clamp((W - 2 * room - 16) / 440, 0.5, 0.96);
      // Everything starts on the first frame and overlaps: glide and tilt together, the
      // layers part from a quarter in, the labels draw in at the end.
      const glide = phase(p, 0, 0.6);
      const tilt = phase(p, 0, 0.75);
      const apart = phase(p, 0.25, 1);
      const show = phase(p, 0.7, 1);

      // The wallpaper dims and blurs on the same timeline, not on a transition of its
      // own, so the card never sits still while the stage changes around it.
      const wall = liquid.current?.canvas;
      if (wall) {
        wall.style.filter = `blur(${(14 * tilt).toFixed(2)}px) saturate(${(1 - 0.15 * tilt).toFixed(3)}) brightness(${(1 - 0.38 * tilt).toFixed(3)})`;
        wall.style.transform = `scale(${(1 + 0.08 * tilt).toFixed(4)})`;
      }
      const x = lerp(home.x, middle.x, glide);
      const y = lerp(home.y, middle.y, glide);

      node.style.transform =
        `translate3d(${x}px, ${y}px, 0) translateY(${14 * tilt}px) ` +
        `rotateX(${56 * tilt}deg) rotateZ(${-34 * tilt}deg) scale(${lerp(1, scale, tilt)})`;

      const k = 1 - Math.exp(-dt / 110);
      panes.current.forEach((el, i) => {
        if (!el) return;
        const want = focus ? (LAYERS[i].key === focus ? 1 : DIM) : 1;
        shade.current[i] += (want - shade.current[i]) * k;
        el.style.opacity = shade.current[i].toFixed(3);
        // The layers themselves answer to hover once they are apart, like their labels.
        el.style.pointerEvents = show > 0.9 ? "auto" : "none";
        el.style.transform = `translateZ(${(i - 2.5) * GAP * apart}px)`;
      });

      // The tint and rim match the live card at the ends, the diagram in between.
      const lightInk = reading?.ink === "light";
      const tintPane = panes.current[3];
      if (tintPane) {
        const a = lerp(reading?.tint ?? 0.12, 0.3, apart);
        const c = lightInk ? [12, 16, 40].map((v) => lerp(v, 255, apart)) : [255, 255, 255];
        tintPane.style.backgroundColor = `rgb(${c.map(Math.round).join(" ")} / ${a.toFixed(3)})`;
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

      placeLabels(stage, W, H, show, focus);
      paintBackdrop(liquid.current, x, y, w, h, [
        panes.current[1] as HTMLCanvasElement | null,
        panes.current[2] as HTMLCanvasElement | null,
      ]);
    };

    // Each label sits level with its layer's right edge, joined to it by a leader line.
    const placeLabels = (
      stage: HTMLElement,
      W: number,
      H: number,
      show: number,
      focus: LayerKey | null,
    ) => {
      const box = stage.getBoundingClientRect();
      // Each line meets its layer near the corner that sticks out furthest toward its
      // label (inset a little, so the dot sits on the layer). One corner per layer
      // stands clear of the stack, which makes it plain which layer a line belongs to.
      const at = LAYERS.map((_, i) => {
        const corners = [0, 1, 2, 3].flatMap((c) => {
          const r = anchors.current[i * 4 + c]?.getBoundingClientRect();
          return r ? [{ x: r.left - box.left, y: r.top - box.top }] : [];
        });
        if (!corners.length) return { x: 0, y: 0 };
        const right = side(i) === "right";
        return corners.reduce((a, b) => ((right ? b.x > a.x : b.x < a.x) ? b : a));
      });
      const width = labels.current.map((l) => l?.offsetWidth ?? 0);
      const height = labels.current.map((l) => l?.offsetHeight ?? 0);
      const on = (s: "left" | "right") => LAYERS.map((_, i) => i).filter((i) => side(i) === s);
      const widest = (s: "left" | "right") => Math.max(0, ...on(s).map((i) => width[i]));
      // Right-hand labels start past the stack's right edge; left-hand ones end before its left.
      const rightX = clamp(
        Math.max(...on("right").map((i) => at[i].x)) + 48,
        12,
        W - widest("right") - 12,
      );
      const leftX = clamp(Math.min(...on("left").map((i) => at[i].x)) - 48, widest("left") + 12, W);
      // On each side, top first, keep the labels apart and inside the stage.
      const ly: number[] = [];
      for (const s of ["left", "right"] as const) {
        const order = on(s).sort((a, b) => at[a].y - at[b].y);
        let prev = -Infinity;
        for (const i of order) {
          ly[i] = Math.max(at[i].y, prev + SPACING);
          prev = ly[i];
        }
        const over = Math.max(0, prev + 28 - H);
        for (const i of order) ly[i] -= over;
      }
      LAYERS.forEach((l, i) => {
        const y = ly[i];
        const right = side(i) === "right";
        const edge = right ? rightX : leftX;
        const label = labels.current[i];
        const lead = leaders.current[i];
        const dim = focus && focus !== l.key ? 0.45 : 1;
        if (label) {
          const caption = label.lastElementChild as HTMLElement | null;
          if (caption) caption.style.display = W >= WIDE ? "" : "none";
          const lx = right ? edge : edge - width[i];
          label.style.transform = `translate(${lx}px, ${y - height[i] / 2}px)`;
          label.style.opacity = (show * dim).toFixed(3);
          label.style.pointerEvents = show > 0.9 ? "auto" : "none";
        }
        if (lead) {
          lead.style.opacity = (show * dim).toFixed(3);
          const [line, dot] = lead.children as unknown as [SVGLineElement, SVGCircleElement];
          const x2 = lerp(at[i].x, right ? edge - 10 : edge + 10, show);
          line.setAttribute("x1", at[i].x.toFixed(1));
          line.setAttribute("y1", at[i].y.toFixed(1));
          line.setAttribute("x2", x2.toFixed(1));
          line.setAttribute("y2", lerp(at[i].y, y, show).toFixed(1));
          dot.setAttribute("cx", at[i].x.toFixed(1));
          dot.setAttribute("cy", at[i].y.toFixed(1));
        }
      });
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      apply(now - last);
      last = now;
    };
    apply(0);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      const wall = liquid.current?.canvas;
      if (wall) {
        wall.style.filter = "";
        wall.style.transform = "";
      }
    };
  }, [shown, liquid]);

  const ref =
    <T,>(list: RefObject<(T | null)[]>, i: number) =>
    (el: T | null) => {
      list.current[i] = el;
    };
  const corners = [styles.tl, styles.tr, styles.br, styles.bl];
  const anchor = (i: number) =>
    corners.map((corner, c) => (
      <span key={c} ref={ref(anchors, i * 4 + c)} {...stylex.props(styles.anchor, corner)} />
    ));
  const hover = (i: number) => ({
    onPointerEnter: () => setFocus(LAYERS[i].key),
    onPointerLeave: () => setFocus(null),
  });

  return (
    <>
      <div ref={root} aria-hidden="true" {...stylex.props(styles.stack, !shown && styles.off)}>
        <div ref={ref(panes, 0)} {...hover(0)} {...stylex.props(styles.pane, styles.shadow)}>
          {anchor(0)}
        </div>
        <div ref={ref(panes, 1)} {...hover(1)} {...stylex.props(styles.pane)}>
          <canvas {...stylex.props(styles.fill)} />
          {anchor(1)}
        </div>
        <div ref={ref(panes, 2)} {...hover(2)} {...stylex.props(styles.pane)}>
          <canvas {...stylex.props(styles.fill)} />
          {anchor(2)}
        </div>
        <div ref={ref(panes, 3)} {...hover(3)} {...stylex.props(styles.pane, styles.tint)}>
          {anchor(3)}
        </div>
        <div ref={ref(panes, 4)} {...hover(4)} {...stylex.props(styles.pane, styles.rim)}>
          {anchor(4)}
        </div>
        <div ref={ref(panes, 5)} {...hover(5)} {...stylex.props(styles.pane, styles.ink)}>
          <WeatherFace unit={unit} />
          {anchor(5)}
        </div>
      </div>

      <div {...stylex.props(styles.overlay, !shown && styles.off)}>
        <svg {...stylex.props(styles.leaders)} aria-hidden="true">
          {LAYERS.map((l, i) => (
            <g key={l.key} ref={ref(leaders, i)} {...stylex.props(styles.leader)}>
              <line />
              <circle r="2.5" />
            </g>
          ))}
        </svg>
        <ul aria-label="The six layers of the glass" {...stylex.props(styles.list)}>
          {LAYERS.map((l, i) => (
            <li key={l.key}>
              <button
                type="button"
                ref={ref(labels, i)}
                tabIndex={shown && open ? 0 : -1}
                onPointerEnter={() => setFocus(l.key)}
                onPointerLeave={() => setFocus(null)}
                onFocus={() => setFocus(l.key)}
                onBlur={() => setFocus(null)}
                {...stylex.props(styles.label, side(i) === "left" && styles.labelLeft)}
              >
                <span {...stylex.props(styles.name)}>{l.name}</span>
                <span {...stylex.props(styles.caption)}>{l.caption}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** Cuts the liquid under the stack's footprint into the blur pane, and the lens pane. */
function paintBackdrop(
  handle: LiquidHandle | null,
  x: number,
  y: number,
  w: number,
  h: number,
  panes: (HTMLElement | null)[],
) {
  const src = handle?.canvas;
  if (!handle || !src || !w || !h) return;
  const box = src.getBoundingClientRect();
  if (!box.width) return;
  const k = src.width / box.width;
  handle.draw();
  panes.forEach((pane, i) => {
    const cv = pane?.querySelector("canvas");
    if (!cv) return;
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    const c = cv.getContext("2d", { willReadFrequently: true });
    if (!c) return;
    c.filter = "blur(2px) saturate(1.8) brightness(1.06)";
    c.drawImage(src, x * k, y * k, w * k, h * k, 0, 0, w, h);
    if (i === 1) {
      const map = createLensMap({ width: w, height: h, radius: 28 });
      c.putImageData(applyLens(c.getImageData(0, 0, w, h), map), 0, 0);
    }
  });
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
  fill: { display: "block", width: "100%", height: "100%", borderRadius: 28 },
  // Candidate points for a layer's leader line: its four corners, inset onto the surface
  // (past the rounding).
  anchor: { position: "absolute", width: 1, height: 1, pointerEvents: "none" },
  tl: { left: 22, top: 22 },
  tr: { right: 22, top: 22 },
  br: { right: 22, bottom: 22 },
  bl: { left: 22, bottom: 22 },
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
    paddingBlock: "18px 16px",
    paddingInline: 20,
  },
  overlay: { position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" },
  leaders: { position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" },
  leader: {
    stroke: "rgb(255 255 255 / 92%)",
    strokeWidth: 1,
    fill: "#fff",
    filter: "drop-shadow(0 0 2px rgb(0 10 40 / .45))",
    opacity: 0,
  },
  list: { listStyle: "none", margin: 0, padding: 0 },
  label: {
    position: "absolute",
    left: 0,
    top: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    paddingBlock: 4,
    paddingInline: 2,
    border: "none",
    borderRadius: 4,
    font: "inherit",
    whiteSpace: "nowrap",
    // One colour on every wallpaper: the stage dims behind the layers, so white reads.
    color: "#fff",
    textShadow: "0 0 10px rgb(0 10 40 / .45), 0 0 2px rgb(0 10 40 / .4)",
    backgroundColor: "transparent",
    cursor: "default",
    opacity: 0,
    pointerEvents: "none",
    outline: { default: "none", ":focus-visible": "1px solid currentColor" },
  },
  labelLeft: { alignItems: "flex-end", textAlign: "right" },
  name: { fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.25 },
  caption: { fontSize: 12, opacity: 0.7, lineHeight: 1.3 },
});
