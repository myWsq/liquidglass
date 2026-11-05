import * as stylex from "@stylexjs/stylex";
import type { PointerEvent } from "react";
import { withClass } from "../sx";
import { AlbumArt } from "./AlbumArt";
import { Icons } from "./icons";

export type PlayerAction = "replay" | "prev" | "play" | "next" | "share";

interface Props {
  t: number;
  duration: number;
  playing: boolean;
  onAction?: (action: PlayerAction) => void;
  onSeek?: (fraction: number) => void;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** The player's contents. Ink comes from the glass around it (`liquidglass-ink`, `liquidglass-sub`). */
export function PlayerFace({ t, duration, playing, onAction, onSeek }: Props) {
  const p = t / duration;
  const seek = (e: PointerEvent<HTMLDivElement>) => {
    if (!onSeek || (e.type === "pointermove" && !e.currentTarget.hasPointerCapture(e.pointerId)))
      return;
    const b = e.currentTarget.getBoundingClientRect();
    onSeek(Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)));
  };
  const buttons: [PlayerAction, string][] = [
    ["replay", "Back 15 seconds"],
    ["prev", "Previous"],
    ["play", playing ? "Pause" : "Play"],
    ["next", "Next"],
    ["share", "Share"],
  ];
  return (
    <>
      <div {...stylex.props(styles.top)}>
        <AlbumArt />
        <div {...stylex.props(styles.meta)}>
          <div {...withClass("liquidglass-ink", styles.title)}>Glass Hours</div>
          <div {...withClass("liquidglass-sub", styles.sub)}>The Lumno Band</div>
        </div>
      </div>
      <div {...withClass("liquidglass-ink", styles.times)}>
        <span>{fmt(t)}</span>
        <span>-{fmt(duration - t)}</span>
      </div>
      <div
        data-no-drag
        {...stylex.props(styles.bar)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          seek(e);
        }}
        onPointerMove={seek}
      >
        <div {...withClass("liquidglass-ink", styles.track)}>
          <div {...stylex.props(styles.fill)} style={{ width: `${p * 100}%` }} />
        </div>
        <div {...stylex.props(styles.knob)} style={{ left: `${p * 100}%` }} />
      </div>
      <div {...withClass("liquidglass-ink", styles.controls)}>
        {buttons.map(([action, label]) => (
          <button
            key={action}
            type="button"
            aria-label={label}
            tabIndex={onAction ? 0 : -1}
            onClick={() => onAction?.(action)}
            {...stylex.props(styles.button)}
          >
            {action === "play" ? (playing ? Icons.pause : Icons.play) : Icons[action]}
          </button>
        ))}
      </div>
    </>
  );
}

const styles = stylex.create({
  top: { display: "flex", gap: 14, alignItems: "center" },
  meta: { minWidth: 0 },
  title: { fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em" },
  sub: { fontSize: 16, marginTop: 3 },
  times: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 18,
    fontSize: 12,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
  },
  bar: { position: "relative", height: 18, marginTop: 4, cursor: "pointer", touchAction: "none" },
  track: {
    position: "absolute",
    insetInline: 0,
    top: 7,
    height: 4,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "color-mix(in srgb, var(--glass-ink) 22%, transparent)",
  },
  fill: {
    position: "absolute",
    insetBlock: 0,
    left: 0,
    borderRadius: 4,
    backgroundColor: "var(--glass-ink)",
  },
  knob: {
    position: "absolute",
    top: 2,
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: "50%",
    backgroundColor: "#fff",
    boxShadow: "0 1px 4px rgb(0 0 0 / .28), 0 0 0 .5px rgb(0 0 0 / .08)",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  button: {
    width: 36,
    height: 34,
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    border: "none",
    padding: 0,
    color: "inherit",
    backgroundColor: "transparent",
    cursor: "pointer",
    transition: "transform .15s",
    transform: { default: null, ":active": "scale(.88)" },
  },
});
