import { Glass, Ink } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useAtom, useAtomValue } from "jotai";
import { explodedAtom, lensAtom, tintAtom } from "../state";

/** Pulls the card apart into its six layers, and puts it back. */
export function ExplodeButton() {
  const lens = useAtomValue(lensAtom);
  const tint = useAtomValue(tintAtom);
  const [exploded, setExploded] = useAtom(explodedAtom);
  return (
    <Glass
      lens={lens === "off" ? false : lens}
      as="button"
      type="button"
      radius="pill"
      rim={14}
      tint={tint}
      aria-pressed={exploded}
      aria-label={exploded ? "Put the layers back" : "Pull the card apart into its layers"}
      title={exploded ? "Put the layers back (Esc)" : "Show the layers"}
      onClick={() => setExploded(!exploded)}
      {...stylex.props(styles.button)}
    >
      <Ink {...stylex.props(styles.icon)}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <g {...stylex.props(styles.sheet, exploded && styles.up)}>
            <path d="M12 3.5 21 8l-9 4.5L3 8z" fill="currentColor" fillOpacity=".2" />
          </g>
          <path d="M3 12l9 4.5 9-4.5" />
          <g {...stylex.props(styles.sheet, exploded && styles.down)}>
            <path d="M3 16l9 4.5 9-4.5" />
          </g>
        </svg>
      </Ink>
    </Glass>
  );
}

const styles = stylex.create({
  button: {
    position: "absolute",
    top: 16,
    right: 64,
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    border: "none",
    padding: 0,
    cursor: "pointer",
    zIndex: 2,
  },
  icon: { display: "grid" },
  // The icon's own sheets part when the card does.
  sheet: { transition: "transform .4s cubic-bezier(.2,.8,.2,1)" },
  up: { transform: "translateY(-1.5px)" },
  down: { transform: "translateY(1.5px)" },
});
