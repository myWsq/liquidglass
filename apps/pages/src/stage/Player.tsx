import * as stylex from "@stylexjs/stylex";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { Glass } from "@myna/liquidglass";
import { lensAtom, readingAtom, tintScaleAtom } from "../state";
import { PlayerFace, type PlayerAction } from "./PlayerFace";

const DURATION = 173;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The demo card: glass that you can drag across the liquid. */
export function Player({ hidden }: { hidden: boolean }) {
  const lens = useAtomValue(lensAtom);
  const setReading = useSetAtom(readingAtom);
  const tintScale = useAtomValue(tintScaleAtom);
  const node = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [t, setT] = useState(22);
  const [playing, setPlaying] = useState(true);
  const [dragging, setDragging] = useState(false);

  // Start a little above centre; stay inside the stage when it resizes.
  useLayoutEffect(() => {
    const el = node.current;
    const stage = el?.offsetParent as HTMLElement | null;
    if (!el || !stage) return;
    const fit = () =>
      setPos((p) => {
        const W = stage.clientWidth;
        const H = stage.clientHeight;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const at = p ?? { x: (W - w) / 2, y: Math.max(56, H * 0.2) };
        return {
          x: clamp(at.x, 8, Math.max(8, W - w - 8)),
          y: clamp(at.y, 8, Math.max(8, H - h - 8)),
        };
      });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((v) => (v + 0.25) % DURATION), 250);
    return () => clearInterval(id);
  }, [playing]);

  const act = (a: PlayerAction) => {
    if (a === "play") setPlaying((v) => !v);
    if (a === "replay") setT((v) => Math.max(0, v - 15));
    if (a === "prev" || a === "next") setT(0);
  };

  const down = (e: PointerEvent<HTMLElement>) => {
    if (!pos || (e.target as HTMLElement).closest("button, [data-no-drag]")) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    const el = node.current;
    const stage = el?.offsetParent as HTMLElement | null;
    if (!d || !el || !stage) return;
    setPos({
      x: clamp(d.ox + e.clientX - d.x, 8, Math.max(8, stage.clientWidth - el.offsetWidth - 8)),
      y: clamp(d.oy + e.clientY - d.y, 8, Math.max(8, stage.clientHeight - el.offsetHeight - 8)),
    });
  };
  const up = () => {
    drag.current = null;
    setDragging(false);
  };

  return (
    <Glass
      lens={lens}
      as="section"
      ref={node}
      aria-label="Glass Hours, playing"
      tintScale={tintScale}
      onReading={setReading}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      {...stylex.props(styles.player, hidden && styles.hidden, dragging && styles.dragging)}
      style={{
        transform: pos ? `translate(${pos.x}px, ${pos.y}px)` : undefined,
        visibility: pos ? undefined : "hidden",
      }}
    >
      <PlayerFace
        t={t}
        duration={DURATION}
        playing={playing}
        onAction={act}
        onSeek={(f) => setT(f * DURATION)}
      />
    </Glass>
  );
}

const styles = stylex.create({
  player: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "clamp(290px, calc(100% - 40px), 380px)",
    paddingBlock: "18px 14px",
    paddingInline: 20,
    cursor: "grab",
    userSelect: "none",
    touchAction: "none",
    willChange: "transform",
    transitionProperty: "opacity, scale",
    transitionDuration: ".5s",
    transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)",
  },
  hidden: { opacity: 0, scale: 0.92, pointerEvents: "none" },
  dragging: { cursor: "grabbing" },
});
