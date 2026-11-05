import * as stylex from "@stylexjs/stylex";
import { Outlet } from "@tanstack/react-router";
import { GitHubIcon, REPO } from "./GitHubIcon";
import { useNarrow } from "./narrow";
import { Code } from "./notes/parts";
import { PerfMeter, showPerf } from "./PerfMeter";
import { Stage } from "./stage/Stage";

export function Shell() {
  const narrow = useNarrow();
  return (
    <main {...stylex.props(styles.app)}>
      <Stage />
      <section {...stylex.props(styles.notes)}>
        {narrow ? (
          // The stage already shows the name; open the notes with what it is.
          <div {...stylex.props(styles.intro)}>
            <h1 {...stylex.props(styles.title)}>Liquid glass for React.</h1>
            <p {...stylex.props(styles.pitch)}>
              A rim that bends the light, a line where it catches, and ink that reads the wallpaper.
              One component, one stylesheet.
            </p>
            <Code code="npm install @myna/liquidglass" language="bash" />
          </div>
        ) : (
          <header {...stylex.props(styles.header)}>
            <span {...stylex.props(styles.name)}>@myna/liquidglass</span>
            <a href={REPO} {...stylex.props(styles.link)}>
              <GitHubIcon />
              GitHub
            </a>
          </header>
        )}
        <Outlet />
      </section>
      {showPerf ? <PerfMeter /> : null}
    </main>
  );
}

const WIDE = "@media (min-width: 1040px)";

const styles = stylex.create({
  app: {
    display: "grid",
    // Stacked, the stage opens the page and gets most of the first screen.
    gridTemplateRows: { default: "minmax(520px, 80svh) auto", [WIDE]: "none" },
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
  intro: { paddingBottom: 30, marginBottom: 30, borderBottom: "1px solid #1a1b1f" },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 650,
    letterSpacing: "-0.025em",
    lineHeight: 1.15,
    color: "#f4f4f5",
  },
  pitch: {
    marginTop: 10,
    marginBottom: 18,
    fontSize: 15,
    lineHeight: 1.5,
    color: "#a1a4ab",
    textWrap: "pretty",
  },
  header: {
    display: "flex",
    alignItems: "center",
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
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontSize: 13,
    color: { default: "#8b8e95", ":hover": "#f2f2f3" },
    textDecoration: "none",
    transition: "color .2s",
  },
});
