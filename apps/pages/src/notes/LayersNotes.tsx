import { Kbd } from "@astryxdesign/core/Kbd";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import * as stylex from "@stylexjs/stylex";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { LAYERS } from "../layers";
import { Code, Eyebrow, Hint } from "./parts";

export function LayersNotes() {
  const { layer } = useSearch({ from: "/layers" });
  const navigate = useNavigate({ from: "/layers" });
  const index = LAYERS.findIndex((l) => l.key === layer);
  const current = LAYERS[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const next = LAYERS[(index + step + LAYERS.length) % LAYERS.length];
      void navigate({ search: { layer: next.key }, replace: true });
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [index, navigate]);

  return (
    <>
      <Eyebrow>01 Layers</Eyebrow>
      <div {...stylex.props(styles.grid)}>
        <List density="compact" edge="flush">
          {LAYERS.map((l, i) => (
            <ListItem
              key={l.key}
              label={l.name}
              startContent={<span {...stylex.props(styles.num)}>0{i + 1}</span>}
              isSelected={l.key === layer}
              onClick={() => void navigate({ search: { layer: l.key }, replace: true })}
            />
          ))}
        </List>
        <div>
          <Text as="p" type="body" display="block" textWrap="pretty" xstyle={styles.text}>
            {current.text}
          </Text>
          <Code code={current.code} language={current.key === "lens" ? "js" : "css"} />
        </div>
      </div>
      <Hint>
        Six layers on one card, on any wallpaper, light or dark. <Kbd keys="up" />{" "}
        <Kbd keys="down" /> to step through.
      </Hint>
    </>
  );
}

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", "@media (min-width: 620px)": "140px 1fr" },
    gap: 22,
    alignItems: "start",
  },
  num: { fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 11, opacity: 0.5 },
  text: { marginBottom: 16 },
});
