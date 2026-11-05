import { Glass } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useAtomValue } from "jotai";
import { GitHubIcon, REPO } from "../GitHubIcon";
import { lensAtom, tintAtom } from "../state";
import { withClass } from "../sx";

/**
 * On the stacked layout the stage opens the page, so it carries the name: a glass bar
 * in line with the layers and sun buttons, made of the same material.
 */
export function TopBar() {
  const lens = useAtomValue(lensAtom);
  const tint = useAtomValue(tintAtom);
  return (
    <Glass
      as="header"
      lens={lens === "off" ? false : lens}
      tint={tint}
      radius="pill"
      rim={14}
      {...stylex.props(styles.bar)}
    >
      <span {...withClass("liquidglass-ink", styles.name)}>@myna/liquidglass</span>
      <a href={REPO} aria-label="GitHub" {...withClass("liquidglass-ink", styles.link)}>
        <GitHubIcon size={18} />
      </a>
    </Glass>
  );
}

const styles = stylex.create({
  bar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 112,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInline: "16px 4px",
    zIndex: 2,
  },
  name: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  link: {
    width: 32,
    height: 32,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: 16,
    color: "inherit",
  },
});
