import { Glass } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useAtom, useAtomValue } from "jotai";
import { lensAtom, readingAtom, tintAtom } from "../state";
import { withClass } from "../sx";

/** Highest wash the slider offers, as a fraction. Auto tops out at 22%. */
const MAX = 0.4;

/**
 * The wash for the glass the card is showing right now (light glass under dark ink,
 * or dark glass under light ink). On Auto the knob follows the live value; dragging
 * fixes it for this appearance only, and Auto hands it back to the wallpaper.
 */
export function TintPill({ visible }: { visible: boolean }) {
  const lens = useAtomValue(lensAtom);
  const [tint, setTint] = useAtom(tintAtom);
  const reading = useAtomValue(readingAtom);
  const appearance = reading?.ink === "light" ? "dark" : "light";
  const auto = tint[appearance] === "auto";
  const live = reading?.tint ?? 0.12;
  const shown = auto ? live : (tint[appearance] as number);
  return (
    <Glass
      lens={lens}
      tint={tint}
      role="group"
      aria-label={`Tint for ${appearance} glass`}
      radius="pill"
      rim={16}
      {...stylex.props(styles.pill, visible && styles.visible)}
    >
      <span {...withClass("liquidglass-sub", styles.label)}>Tint</span>
      <input
        type="range"
        min={0}
        max={MAX * 100}
        value={Math.round(shown * 100)}
        aria-label={`Tint strength for ${appearance} glass`}
        aria-valuetext={auto ? `Auto, ${Math.round(live * 100)}%` : `${Math.round(shown * 100)}%`}
        onChange={(e) => setTint({ ...tint, [appearance]: Number(e.target.value) / 100 })}
        tabIndex={visible ? 0 : -1}
        {...stylex.props(styles.range)}
      />
      <span {...withClass("liquidglass-ink", styles.pct)}>{Math.round(shown * 100)}%</span>
      <button
        type="button"
        aria-pressed={auto}
        tabIndex={visible ? 0 : -1}
        onClick={() => setTint({ ...tint, [appearance]: "auto" })}
        {...withClass("liquidglass-ink", styles.auto, auto && styles.autoOn)}
      >
        Auto
      </button>
    </Glass>
  );
}

const styles = stylex.create({
  pill: {
    position: "absolute",
    left: "50%",
    bottom: 22,
    width: 330,
    height: 44,
    display: "flex",
    alignItems: "center",
    gap: 12,
    paddingInline: "16px 6px",
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
  pct: { width: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" },
  auto: {
    height: 32,
    paddingInline: 12,
    border: "none",
    borderRadius: 16,
    font: "inherit",
    cursor: "pointer",
    backgroundColor: "transparent",
    boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--glass-ink) 28%, transparent)",
    opacity: { default: 0.7, ":hover": 1 },
    transition: "background-color .2s, opacity .2s, box-shadow .2s",
  },
  autoOn: {
    opacity: 1,
    backgroundColor: "color-mix(in srgb, var(--glass-ink) 14%, transparent)",
    boxShadow: "none",
  },
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
