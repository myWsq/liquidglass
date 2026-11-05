import * as stylex from "@stylexjs/stylex";
import { GitHubIcon, REPO } from "../GitHubIcon";

/**
 * On the stacked layout the stage opens the page, so it carries the name: plain text in
 * line with the layers and sun buttons. White with a soft shadow, like the layer labels,
 * so it reads on any wallpaper without being another piece of glass.
 */
export function TopBar() {
  return (
    <header {...stylex.props(styles.bar)}>
      <span {...stylex.props(styles.name)}>@myna/liquidglass</span>
      <a href={REPO} aria-label="GitHub" {...stylex.props(styles.link)}>
        <GitHubIcon size={18} />
      </a>
    </header>
  );
}

const shadow = "0 0 10px rgb(0 10 40 / .45), 0 0 2px rgb(0 10 40 / .4)";

const styles = stylex.create({
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
    textShadow: shadow,
  },
  link: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    color: "inherit",
    filter: "drop-shadow(0 0 3px rgb(0 10 40 / .45))",
    opacity: { default: 0.9, ":hover": 1 },
  },
});
