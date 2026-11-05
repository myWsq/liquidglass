import { LinkProvider } from "@astryxdesign/core/Link";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import * as stylex from "@stylexjs/stylex";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type AnchorHTMLAttributes } from "react";
import { SECTIONS, type SectionPath } from "./router";
import { Stage } from "./stage/Stage";

/** astryx renders links with `href`; TanStack Router navigates with `to`. */
function RouterLink({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link to={href as SectionPath} {...rest} />;
}

export function useSection(): SectionPath {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return SECTIONS.find((s) => s.path === path)?.path ?? "/";
}

export function Shell() {
  const section = useSection();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const i = SECTIONS.findIndex((s) => s.path === section);
      const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -1;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (next < 0 || next >= SECTIONS.length) return;
      void navigate({ to: SECTIONS[next].path });
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [section, navigate]);

  return (
    <LinkProvider component={RouterLink}>
      <main {...stylex.props(styles.app)}>
        <Stage section={section} />
        <section {...stylex.props(styles.notes)}>
          <TabList value={section} onChange={() => {}} size="sm" hasDivider>
            {SECTIONS.map((s) => (
              <Tab key={s.path} value={s.path} label={s.label} href={s.path} />
            ))}
          </TabList>
          <div {...stylex.props(styles.panel)}>
            <Outlet />
          </div>
        </section>
      </main>
    </LinkProvider>
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
  panel: {
    paddingTop: 26,
  },
});
