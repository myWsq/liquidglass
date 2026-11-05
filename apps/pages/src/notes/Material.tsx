import { Banner } from "@astryxdesign/core/Banner";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { supportsLens } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useAtom, useAtomValue } from "jotai";
import { lensAtom, readingAtom, tintScaleAtom } from "../state";
import { Code, Eyebrow, Hint, Lead, Mono } from "./parts";

const FOUR = `.player {
  background: var(--glass-tint);
  backdrop-filter: var(--glass-blur) var(--glass-lens);
  box-shadow: var(--glass-edge);
  color: var(--glass-ink);
}`;

/** The four declarations, and how the card reads the wallpaper to fill them in. */
export function Material() {
  const r = useAtomValue(readingAtom);
  const scale = useAtomValue(tintScaleAtom);
  const [lens, setLens] = useAtom(lensAtom);
  const light = r?.ink === "light";
  const appearance = light ? "dark" : "light";
  const tint = Math.round((r?.tint ?? 0.12) * 100);
  const filterOk = supportsLens();
  const running = lens === "auto" ? (filterOk ? "filter" : "canvas") : lens;
  return (
    <>
      <Eyebrow>Four declarations</Eyebrow>
      <Lead>
        Any component turns to glass by trading four declarations for the material’s tokens.
      </Lead>
      <Code code={FOUR} />
      <div {...stylex.props(styles.block)}>
        <MetadataList label={{ position: "start", width: 120 }}>
          <MetadataListItem label="--glass-tint">
            <Mono>
              rgb({light ? "12 16 40" : "255 255 255"} / {tint}%) + rim glow
            </Mono>
          </MetadataListItem>
          <MetadataListItem label="--glass-blur">
            <Mono>blur(2px) saturate(1.8) brightness(1.06)</Mono>
          </MetadataListItem>
          <MetadataListItem label="--glass-lens">
            <Mono>
              {running === "filter" ? "url(#lens) · SVG filter" : "none · refracted in a canvas"}
            </Mono>
          </MetadataListItem>
          <MetadataListItem label="--glass-edge">
            <Mono>shadow + inset rim light</Mono>
          </MetadataListItem>
          <MetadataListItem label="--glass-ink">
            <Mono>{light ? "rgb(255 255 255 / 94%) · screen" : "rgb(0 0 0 / 86%) · multiply"}</Mono>
          </MetadataListItem>
        </MetadataList>
      </div>
      <div {...stylex.props(styles.switch)}>
        <Mono dim>rim lens</Mono>
        <SegmentedControl
          label="How the rim lens runs"
          size="sm"
          value={lens}
          onChange={(v) => setLens(v as typeof lens)}
        >
          <SegmentedControlItem value="auto" label="Auto" />
          <SegmentedControlItem value="filter" label="SVG filter" isDisabled={!filterOk} />
          <SegmentedControlItem value="canvas" label="Canvas" />
        </SegmentedControl>
      </div>
      <Hint>
        The filter is Chromium’s; the canvas copies the liquid under the glass and bends it on the
        CPU, which every browser can do.
      </Hint>
      {filterOk ? null : (
        <div {...stylex.props(styles.banner)}>
          <Banner
            status="info"
            title="Canvas lens"
            description="This browser can't run SVG filters inside backdrop-filter, so the glass refracts the liquid in a canvas instead. Glass over ordinary page content falls back to blur."
          />
        </div>
      )}

      <div {...stylex.props(styles.section)}>
        <Eyebrow>Light &amp; dark</Eyebrow>
        <Lead>
          The card reads the wallpaper under it and picks its ink. The tint’s strength is kept apart
          for light and dark.
        </Lead>
        <MetadataList label={{ position: "start", width: 120 }}>
          <MetadataListItem label="luminance">
            <Mono>{r ? r.luminance.toFixed(2) : "—"}</Mono>{" "}
            <Mono dim>the wallpaper under the card</Mono>
          </MetadataListItem>
          <MetadataListItem label="ink">
            <Mono>{r?.ink ?? "dark"}</Mono> <Mono dim>light below 0.5</Mono>
          </MetadataListItem>
          <MetadataListItem label="tint">
            <Mono dim={appearance !== "light"}>light ×{scale.light.toFixed(2)}</Mono> ·{" "}
            <Mono dim={appearance !== "dark"}>dark ×{scale.dark.toFixed(2)}</Mono>{" "}
            <Mono dim>set per theme</Mono>
          </MetadataListItem>
          <MetadataListItem label="wash">
            <Mono>{tint}%</Mono>{" "}
            <Mono dim>6–22% by busyness (σ {r ? r.busyness.toFixed(2) : "—"})</Mono>
          </MetadataListItem>
        </MetadataList>
        <Hint>
          Drag the card from a pale current into a deep one, or flip the wallpaper with the button
          in the corner. The tint pill edits only the current theme’s multiplier. The sun button,
          the pill and the card are all the same material.
        </Hint>
      </div>
    </>
  );
}

const styles = stylex.create({
  block: { marginTop: 24 },
  switch: { marginTop: 22, display: "flex", alignItems: "center", gap: 14 },
  banner: { marginTop: 18 },
  section: { marginTop: 44, paddingTop: 28, borderTop: "1px solid #1a1b1f" },
});
