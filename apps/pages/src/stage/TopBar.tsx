import * as stylex from "@stylexjs/stylex";
import { GitHubIcon, REPO } from "../GitHubIcon";

/**
 * On the stacked layout the stage opens the page, so it carries the name: plain white
 * text in line with the layers and sun buttons. A soft dark gradient along the top of
 * the stage keeps it readable on any part of the liquid, so the text needs no shadow.
 */
export function TopBar() {
  return (
    <>
      <div aria-hidden="true" {...stylex.props(styles.scrim)} />
      <header {...stylex.props(styles.bar)}>
        <span {...stylex.props(styles.name)}>@myna/liquidglass</span>
        <a href={REPO} aria-label="GitHub" {...stylex.props(styles.link)}>
          <GitHubIcon size={18} />
        </a>
      </header>
    </>
  );
}

const styles = stylex.create({
  // Eased so it has no visible edge: strongest at the very top, gone by ~120px.
  scrim: {
    position: "absolute",
    insetInline: 0,
    top: 0,
    height: 120,
    zIndex: 1,
    pointerEvents: "none",
    backgroundImage:
      "linear-gradient(to bottom, rgb(0 6 24 / .42) 0%, rgb(0 6 24 / .3) 28%, rgb(0 6 24 / .14) 58%, rgb(0 6 24 / .04) 82%, transparent 100%)",
  },
  bar: {
    position: "absolute",
    top: 16,
    left: 20,
    right: 112,
    height: 40,
    display: "flex",
    alignItems: "center",
    gap: 10,
    zIndex: 2,
    color: "#fff",
  },
  name: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
  },
  link: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    color: "inherit",
    opacity: { default: 0.9, ":hover": 1 },
  },
});
