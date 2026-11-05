import { Glass, Ink } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useAtom, useAtomValue } from "jotai";
import { lensAtom, readingAtom, tintAtom } from "../state";

/** Highest wash the slider offers, as a fraction. Auto tops out at 22%. */
const MAX = 0.4;
const ease = "cubic-bezier(.2,.8,.2,1)";

/**
 * The wash for the glass the card is showing right now (light glass under dark ink,
 * or dark glass under light ink). With Auto on there is nothing to drag: the pill just
 * shows the live value. Turning Auto off slides a slider in, starting from that value;
 * the setting is kept apart for light and dark glass.
 */
export function TintPill({ visible }: { visible: boolean }) {
  const lens = useAtomValue(lensAtom);
  const [tint, setTint] = useAtom(tintAtom);
  const reading = useAtomValue(readingAtom);
  const appearance = reading?.ink === "light" ? "dark" : "light";
  const setting = tint[appearance];
  const auto = setting === "auto";
  const live = reading?.tint ?? 0.12;
  const value = auto ? live : setting;
  const toggle = () =>
    setTint({ ...tint, [appearance]: auto ? Math.round(live * 100) / 100 : "auto" });

  return (
    <Glass
      lens={lens === "off" ? false : lens}
      tint={tint}
      role="group"
      aria-label={`Tint for ${appearance} glass`}
      radius="pill"
      rim={16}
      {...stylex.props(styles.pill, visible && styles.visible)}
    >
      <Ink tone="secondary" {...stylex.props(styles.label)}>
        Tint
      </Ink>
      <span {...stylex.props(styles.slot, !auto && styles.slotOpen)} aria-hidden={auto}>
        <input
          type="range"
          min={0}
          max={MAX * 100}
          value={Math.round(value * 100)}
          aria-label={`Tint strength for ${appearance} glass`}
          disabled={auto}
          tabIndex={visible && !auto ? 0 : -1}
          onChange={(e) => setTint({ ...tint, [appearance]: Number(e.target.value) / 100 })}
          {...stylex.props(styles.range)}
        />
      </span>
      <Ink {...stylex.props(styles.pct)}>{Math.round(value * 100)}%</Ink>
      <button
        type="button"
        role="switch"
        aria-checked={auto}
        tabIndex={visible ? 0 : -1}
        onClick={toggle}
        {...stylex.props(styles.switch)}
      >
        <Ink tone="secondary" {...stylex.props(styles.switchLabel)}>
          Auto
        </Ink>
        <span {...stylex.props(styles.track, auto && styles.trackOn)}>
          <span {...stylex.props(styles.thumb, auto && styles.thumbOn)} />
        </span>
      </button>
    </Glass>
  );
}

const styles = stylex.create({
  pill: {
    position: "absolute",
    left: "50%",
    bottom: 22,
    height: 44,
    display: "flex",
    alignItems: "center",
    gap: 12,
    paddingInline: "16px 8px",
    fontSize: 13,
    fontWeight: 500,
    zIndex: 2,
    whiteSpace: "nowrap",
    opacity: 0,
    pointerEvents: "none",
    transform: "translate(-50%, 10px)",
    transitionProperty: "opacity, transform",
    transitionDuration: ".4s",
  },
  visible: { opacity: 1, pointerEvents: "auto", transform: "translate(-50%, 0)" },
  label: {},
  // The slider folds away with Auto on; the pill narrows around it.
  slot: {
    display: "flex",
    alignItems: "center",
    width: 0,
    marginInline: -6,
    overflow: "hidden",
    opacity: 0,
    transition: `width .45s ${ease}, margin .45s ${ease}, opacity .25s ease`,
  },
  slotOpen: {
    width: 150,
    marginInline: 0,
    opacity: 1,
    transition: `width .45s ${ease}, margin .45s ${ease}, opacity .3s ease .12s`,
  },
  pct: { minWidth: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" },
  range: {
    width: 150,
    flexShrink: 0,
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
  switch: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 32,
    paddingInline: 8,
    border: "none",
    borderRadius: 16,
    font: "inherit",
    cursor: "pointer",
    color: "inherit",
    backgroundColor: {
      default: "transparent",
      ":hover": "color-mix(in srgb, var(--glass-ink) 8%, transparent)",
    },
    transition: "background-color .2s",
  },
  switchLabel: {},
  track: {
    position: "relative",
    width: 34,
    height: 20,
    borderRadius: 10,
    backgroundColor: "color-mix(in srgb, var(--glass-ink) 22%, transparent)",
    transition: "background-color .3s ease",
  },
  trackOn: { backgroundColor: "#0a84ff" },
  thumb: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 16,
    height: 16,
    borderRadius: "50%",
    backgroundColor: "#fff",
    boxShadow: "0 1px 3px rgb(0 0 0 / .3)",
    transform: "translateX(0)",
    transition: `transform .35s ${ease}`,
  },
  thumbOn: { transform: "translateX(14px)" },
});
