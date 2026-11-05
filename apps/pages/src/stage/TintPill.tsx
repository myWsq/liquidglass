import * as stylex from "@stylexjs/stylex";
import { useAtom, useAtomValue } from "jotai";
import { Glass } from "@myna/liquidglass";
import { lensAtom, readingAtom, tintScaleAtom } from "../state";
import { withClass } from "../sx";

/** Edits the wash multiplier — only for the appearance the card has right now. */
export function TintPill({ visible }: { visible: boolean }) {
  const lens = useAtomValue(lensAtom);
  const [scale, setScale] = useAtom(tintScaleAtom);
  const reading = useAtomValue(readingAtom);
  const appearance = reading?.ink === "light" ? "dark" : "light";
  return (
    <Glass
      lens={lens}
      as="label"
      radius="pill"
      rim={16}
      tintScale={scale}
      {...stylex.props(styles.pill, visible && styles.visible)}
    >
      <span {...withClass("liquidglass-sub", styles.label)}>Tint</span>
      <input
        type="range"
        min={0}
        max={200}
        value={Math.round(scale[appearance] * 100)}
        aria-label={`Tint strength for ${appearance} glass`}
        onChange={(e) => setScale({ ...scale, [appearance]: Number(e.target.value) / 100 })}
        tabIndex={visible ? 0 : -1}
        {...stylex.props(styles.range)}
      />
      <span {...withClass("liquidglass-ink", styles.pct)}>
        {Math.round((reading?.tint ?? 0.12) * 100)}%
      </span>
    </Glass>
  );
}

const styles = stylex.create({
  pill: {
    position: "absolute",
    left: "50%",
    bottom: 22,
    width: 270,
    height: 44,
    display: "flex",
    alignItems: "center",
    gap: 12,
    paddingInline: 16,
    fontSize: 13,
    fontWeight: 500,
    zIndex: 2,
    opacity: 0,
    pointerEvents: "none",
    transform: "translate(-50%, 10px)",
    transitionProperty: "opacity, transform",
    transitionDuration: ".4s",
  },
  visible: { opacity: 1, pointerEvents: "auto", transform: "translate(-50%, 0)" },
  label: {},
  pct: { width: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" },
  range: {
    flex: 1,
    minWidth: 0,
    height: 18,
    margin: 0,
    cursor: "pointer",
    appearance: "none",
    backgroundColor: "transparent",
    "::-webkit-slider-runnable-track": {
      height: 4,
      borderRadius: 4,
      backgroundColor: "color-mix(in srgb, var(--glass-ink) 22%, transparent)",
    },
    "::-moz-range-track": {
      height: 4,
      borderRadius: 4,
      backgroundColor: "color-mix(in srgb, var(--glass-ink) 22%, transparent)",
    },
    "::-webkit-slider-thumb": {
      appearance: "none",
      width: 16,
      height: 16,
      marginTop: -6,
      borderRadius: "50%",
      backgroundColor: "#fff",
      boxShadow: "0 1px 4px rgb(0 0 0 / .3)",
    },
    "::-moz-range-thumb": {
      width: 16,
      height: 16,
      border: "none",
      borderRadius: "50%",
      backgroundColor: "#fff",
      boxShadow: "0 1px 4px rgb(0 0 0 / .3)",
    },
  },
});
