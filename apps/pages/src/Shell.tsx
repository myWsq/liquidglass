import * as stylex from "@stylexjs/stylex";
import { Outlet } from "@tanstack/react-router";
import { Stage } from "./stage/Stage";

export function Shell() {
  return (
    <main {...stylex.props(styles.app)}>
      <Stage />
      <section {...stylex.props(styles.notes)}>
        <header {...stylex.props(styles.header)}>
          <span {...stylex.props(styles.name)}>@myna/liquidglass</span>
          <nav {...stylex.props(styles.links)}>
            <a href="https://github.com/myWsq/liquidglass" {...stylex.props(styles.link)}>
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@myna/liquidglass"
              {...stylex.props(styles.link)}
            >
              npm
            </a>
          </nav>
        </header>
        <Outlet />
      </section>
    </main>
  );
}

const WIDE = "@media (min-width: 1040px)";

const styles = stylex.create({
  app: {
    display: "grid",
    gridTemplateRows: { default: "minmax(440px, 62vh) auto", [WIDE]: "none" },
    gridTemplateColumns: { default: "none", [WIDE]: "1fr 540px" },
    minHeight: "100%",
    height: { default: "auto", [WIDE]: "100vh" },
    backgroundColor: "#0b0c0e",
  },
  notes: {
    paddingBlock: { default: "22px 40px", [WIDE]: "28px" },
    paddingInline: { default: "18px", [WIDE]: "32px" },
    overflow: "auto",
    borderTop: { default: "1px solid #1a1b1f", [WIDE]: "none" },
    borderLeft: { default: "none", [WIDE]: "1px solid #1a1b1f" },
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingBottom: 18,
    marginBottom: 26,
    borderBottom: "1px solid #1a1b1f",
  },
  name: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
    fontSize: 13,
    color: "#e9e9ea",
  },
  links: { display: "flex", gap: 18 },
  link: {
    fontSize: 13,
    color: { default: "#8b8e95", ":hover": "#f2f2f3" },
    textDecoration: "none",
    transition: "color .2s",
  },
});
