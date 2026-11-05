import { Ink } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useId } from "react";

export type Unit = "c" | "f";
type Sky = "sun" | "partly" | "cloud" | "dusk" | "moon";

const NOW = {
  city: "Kyoto",
  temp: 23,
  sky: "partly" as Sky,
  label: "Partly cloudy",
  hi: 26,
  lo: 17,
};
const HOURS: { at: string; temp: number; sky: Sky }[] = [
  { at: "Now", temp: 23, sky: "partly" },
  { at: "15", temp: 24, sky: "sun" },
  { at: "16", temp: 24, sky: "sun" },
  { at: "17", temp: 22, sky: "partly" },
  { at: "18", temp: 20, sky: "dusk" },
  { at: "19", temp: 18, sky: "moon" },
];

const deg = (c: number, unit: Unit) => `${Math.round(unit === "c" ? c : (c * 9) / 5 + 32)}°`;

/**
 * The demo card's contents: a weather widget. Its text and icons are `<Ink>`, so they
 * follow the glass around them and read on light glass and dark glass.
 */
export function WeatherFace({ unit, onUnit }: { unit: Unit; onUnit?: (unit: Unit) => void }) {
  return (
    <>
      <div {...stylex.props(styles.top)}>
        <div>
          <Ink as="div" {...stylex.props(styles.city)}>
            {NOW.city}
            <PinIcon />
          </Ink>
          <Ink as="div" {...stylex.props(styles.temp)}>
            {deg(NOW.temp, unit)}
          </Ink>
        </div>
        <div {...stylex.props(styles.side)}>
          <Ink
            as="button"
            type="button"
            tabIndex={onUnit ? 0 : -1}
            aria-label={unit === "c" ? "Show Fahrenheit" : "Show Celsius"}
            onClick={() => onUnit?.(unit === "c" ? "f" : "c")}
            {...stylex.props(styles.unit)}
          >
            °{unit === "c" ? "C" : "F"}
          </Ink>
          <SkyIcon sky={NOW.sky} size={34} />
          <Ink as="div" {...stylex.props(styles.label)}>
            {NOW.label}
          </Ink>
          <Ink as="div" tone="secondary" {...stylex.props(styles.range)}>
            H:{deg(NOW.hi, unit)} L:{deg(NOW.lo, unit)}
          </Ink>
        </div>
      </div>
      <Ink as="div" {...stylex.props(styles.rule)} />
      <div {...stylex.props(styles.hours)}>
        {HOURS.map((h) => (
          <div key={h.at} {...stylex.props(styles.hour)}>
            <Ink tone="secondary" {...stylex.props(styles.at)}>
              {h.at}
            </Ink>
            <SkyIcon sky={h.sky} size={22} />
            <Ink {...stylex.props(styles.small)}>{deg(h.temp, unit)}</Ink>
          </div>
        ))}
      </div>
    </>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.4 2.6a1 1 0 0 0-1.06-.22L3.1 9.06a1 1 0 0 0 .08 1.9l7.06 2.02 2 7.06a1 1 0 0 0 1.9.08l6.7-17.26a1 1 0 0 0-.22-1.06z" />
    </svg>
  );
}

/** Line icons in the ink colour; the sun's disc is filled so it reads at small sizes. */
function SkyIcon({ sky, size }: { sky: Sky; size: number }) {
  const behind = `sky-${useId().replace(/[^\w-]/g, "")}`;
  const sun = (cx: number, cy: number, r: number) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const t = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={cx + Math.cos(t) * (r + 2.2)}
            y1={cy + Math.sin(t) * (r + 2.2)}
            x2={cx + Math.cos(t) * (r + 4.2)}
            y2={cy + Math.sin(t) * (r + 4.2)}
          />
        );
      })}
    </g>
  );
  const CLOUD =
    "M7.5 19h9.25a4.25 4.25 0 0 0 .54-8.47A5.75 5.75 0 0 0 6.2 11.6 3.75 3.75 0 0 0 7.5 19z";
  const cloud = <path d={CLOUD} />;
  return (
    <Ink
      as="svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {sky === "sun" && sun(12, 12, 4)}
      {sky === "partly" && (
        <>
          {/* The cloud hides the part of the sun behind it, with a small gap around it. */}
          <mask id={behind} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
            <rect width="24" height="24" fill="#fff" stroke="none" />
            <path d={CLOUD} fill="#000" stroke="#000" strokeWidth="3.6" />
          </mask>
          <g mask={`url(#${behind})`}>
            <g transform="translate(-3 -3) scale(.8)">{sun(12, 12, 4)}</g>
          </g>
          <g fill="currentColor" fillOpacity=".18">
            {cloud}
          </g>
        </>
      )}
      {sky === "cloud" && cloud}
      {sky === "dusk" && (
        <>
          <path d="M6.5 16a5.5 5.5 0 0 1 11 0" />
          <path d="M3 16h18M7 20h10M12 4v3M5.2 8.2l1.6 1.6M18.8 8.2l-1.6 1.6" />
        </>
      )}
      {sky === "moon" && (
        <path
          d="M19.5 14.3A7.5 7.5 0 0 1 9.7 4.5a7.5 7.5 0 1 0 9.8 9.8z"
          fill="currentColor"
          fillOpacity=".18"
        />
      )}
    </Ink>
  );
}

const styles = stylex.create({
  top: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  city: { display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 600 },
  temp: {
    fontSize: 64,
    fontWeight: 250,
    lineHeight: 1,
    letterSpacing: "-0.04em",
    marginTop: 6,
    fontVariantNumeric: "tabular-nums",
  },
  side: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 },
  unit: {
    height: 24,
    paddingInline: 9,
    marginBottom: 6,
    border: "none",
    borderRadius: 12,
    font: "inherit",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: "color-mix(in srgb, var(--glass-ink) 12%, transparent)",
    transform: { default: null, ":active": "scale(.92)" },
    transition: "transform .15s",
  },
  label: { fontSize: 13, fontWeight: 600, marginTop: 2 },
  range: { fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums" },
  rule: {
    height: 1,
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: "color-mix(in srgb, var(--glass-ink) 16%, transparent)",
  },
  hours: { display: "flex", justifyContent: "space-between" },
  hour: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 40 },
  at: { fontSize: 12, fontWeight: 600 },
  small: { fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" },
});
