import { Liquid, type LiquidHandle } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useSearch } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
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
  // After leaving the layers page the stack keeps the stage until it lands on the card.
  const [returning, setReturning] = useState(false);
  useEffect(() => {
    if (exploded) setReturning(true);
  }, [exploded]);
  const stackShown = exploded || returning;

  return (
    <Liquid
      ref={liquid}
      theme={theme}
      canvasProps={stylex.props(styles.wall, exploded && styles.wallBehind)}
      {...stylex.props(styles.stage)}
    >
      <LayerStack
        open={exploded}
        shown={stackShown}
        layer={layer ?? "shadow"}
        liquid={liquid}
        onLanded={() => setReturning(false)}
      />
      <Player hidden={stackShown} />
      <ThemeButton />
      <TintPill visible={section === "/"} />
    </Liquid>
  );
}

const styles = stylex.create({
  stage: {
    minHeight: 440,
    perspective: "1500px",
  },
  wall: {
    transition: "filter .9s ease, transform .9s ease",
  },
  wallBehind: {
    filter: "blur(14px) saturate(.85) brightness(.9)",
    transform: "scale(1.08)",
  },
});
