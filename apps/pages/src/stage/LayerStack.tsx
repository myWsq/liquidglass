import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, type RefObject } from "react";
import { applyLens, createLensMap, type LiquidHandle } from "@myna/liquidglass";
import { LAYERS, type LayerKey } from "../layers";
import { PlayerFace } from "./PlayerFace";

interface Props {
  visible: boolean;
  layer: LayerKey;
  liquid: RefObject<LiquidHandle | null>;
}

/**
 * The card, exploded into its six layers. The blur and lens panes are cut live from
 * the liquid under the stack; the lens is applied on the CPU with the same map the
 * real glass uses, so the diagram works in every browser.
 */
export function LayerStack({ visible, layer, liquid }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const blur = useRef<HTMLCanvasElement>(null);
  const lens = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    let last = 0;
    const paint = (now: number) => {
      raf = requestAnimationFrame(paint);
      if (now - last < 50) return;
      last = now;
      const handle = liquid.current;
      const src = handle?.canvas;
      const node = root.current;
      if (!handle || !src || !node) return;
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const box = src.getBoundingClientRect();
      if (!w || !h || !box.width) return;
      const k = src.width / box.width;
      handle.draw();
      for (const [cv, refract] of [
        [blur.current, false],
        [lens.current, true],
      ] as const) {
        if (!cv) continue;
        if (cv.width !== w || cv.height !== h) {
          cv.width = w;
          cv.height = h;
        }
        const c = cv.getContext("2d", { willReadFrequently: true });
        if (!c) continue;
        c.filter = "blur(2px) saturate(1.8) brightness(1.06)";
        c.drawImage(
          src,
          ((box.width - w) / 2) * k,
          ((box.height - h) / 2) * k,
          w * k,
          h * k,
          0,
          0,
          w,
          h,
        );
        if (refract) {
          const map = createLensMap({ width: w, height: h, radius: 28 });
          c.putImageData(applyLens(c.getImageData(0, 0, w, h), map), 0, 0);
        }
      }
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [visible, liquid]);

  const pane = (i: number) => [
    styles.pane,
    visible && (LAYERS[i].key === layer ? styles.on : styles.off),
  ];
  const depth = (i: number) => ({ transform: `translateZ(${(i - 2.5) * (visible ? 40 : 0)}px)` });

  return (
    <div ref={root} aria-hidden="true" {...stylex.props(styles.stack, visible && styles.exploded)}>
      <div {...stylex.props(pane(0), styles.shadow)} style={depth(0)} />
      <canvas ref={blur} {...stylex.props(pane(1))} style={depth(1)} />
      <canvas ref={lens} {...stylex.props(pane(2))} style={depth(2)} />
      <div {...stylex.props(pane(3), styles.tint)} style={depth(3)} />
      <div {...stylex.props(pane(4), styles.rim)} style={depth(4)} />
      <div {...stylex.props(pane(5), styles.ink)} style={depth(5)}>
        <PlayerFace t={22} duration={173} playing />
      </div>
    </div>
  );
}

const ease = "cubic-bezier(.2,.8,.2,1)";

const styles = stylex.create({
  stack: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "clamp(290px, calc(100% - 40px), 380px)",
    transformStyle: "preserve-3d",
    pointerEvents: "none",
    transform: "translate(-50%, -50%)",
    transition: `transform 1s ${ease}`,
  },
  exploded: {
    transform: "translate(-50%, -50%) translateY(14px) rotateX(56deg) rotateZ(-34deg) scale(.96)",
  },
  pane: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    borderRadius: 28,
    opacity: 0,
    transition: `transform 1s ${ease}, opacity .45s ease`,
  },
  on: { opacity: 1 },
  off: { opacity: 0.14 },
  shadow: {
    backgroundColor: "rgb(0 0 0 / .05)",
    boxShadow: "0 0 0 .5px rgb(0 0 0 / .12), 0 10px 36px rgb(0 0 0 / .22)",
  },
  tint: {
    backgroundColor: "rgb(255 255 255 / .3)",
    boxShadow: "inset 0 0 0 .5px rgb(255 255 255 / .6)",
  },
  rim: {
    boxShadow:
      "inset 2px 2px 1px -1px #fff, inset -2px -2px 1px -1px rgb(255 255 255 / .6), 0 0 0 .5px rgb(255 255 255 / .25)",
    backgroundImage: "radial-gradient(at 0 0, rgb(255 255 255 / .45), transparent 55%)",
  },
  ink: {
    position: "relative",
    height: "auto",
    paddingBlock: "18px 14px",
    paddingInline: 20,
  },
});
