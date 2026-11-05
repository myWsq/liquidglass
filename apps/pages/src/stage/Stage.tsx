import { Liquid, type LiquidHandle } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { cardAtom, explodedAtom, themeAtom } from "../state";
import { ExplodeButton } from "./ExplodeButton";
import { LayerStack } from "./LayerStack";
import { ThemeButton } from "./ThemeButton";
import { TintPill } from "./TintPill";
import { WeatherCard } from "./WeatherCard";

export function Stage() {
  const theme = useAtomValue(themeAtom);
  const [exploded, setExploded] = useAtom(explodedAtom);
  const setCard = useSetAtom(cardAtom);
  const liquid = useRef<LiquidHandle>(null);
  // After the layers go back together the stack keeps the stage until it has landed.
  const [returning, setReturning] = useState(false);
  useEffect(() => {
    if (exploded) setReturning(true);
  }, [exploded]);
  const stackShown = exploded || returning;

  useEffect(() => {
    if (!exploded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExploded(false);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [exploded, setExploded]);

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
        liquid={liquid}
        onLanded={(at) => {
          setCard(at);
          setReturning(false);
        }}
      />
      <WeatherCard hidden={stackShown} />
      <ExplodeButton />
      <ThemeButton />
      <TintPill visible={!stackShown} />
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
