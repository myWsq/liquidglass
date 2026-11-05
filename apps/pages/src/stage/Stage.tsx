import * as stylex from "@stylexjs/stylex";
import { useSearch } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { useRef } from "react";
import { Liquid, type LiquidHandle } from "@myna/liquidglass";
import type { SectionPath } from "../router";
import { themeAtom } from "../state";
import { LayerStack } from "./LayerStack";
import { Player } from "./Player";
import { ThemeButton } from "./ThemeButton";
import { TintPill } from "./TintPill";

export function Stage({ section }: { section: SectionPath }) {
  const theme = useAtomValue(themeAtom);
  const liquid = useRef<LiquidHandle>(null);
  const { layer } = useSearch({ strict: false });
  const exploded = section === "/layers";
  return (
    <Liquid
      ref={liquid}
      theme={theme}
      canvasProps={stylex.props(styles.wall, exploded && styles.wallBehind)}
      {...stylex.props(styles.stage)}
    >
      <LayerStack visible={exploded} layer={layer ?? "shadow"} liquid={liquid} />
      <Player hidden={exploded} />
      <ThemeButton />
      <TintPill visible={section === "/light-and-dark"} />
    </Liquid>
  );
}

const styles = stylex.create({
  stage: {
    minHeight: 440,
    perspective: "1500px",
    touchAction: "none",
  },
  wall: {
    transition: "filter .8s ease, transform .8s ease",
  },
  wallBehind: {
    filter: "blur(14px) saturate(.85) brightness(.9)",
    transform: "scale(1.08)",
  },
});
