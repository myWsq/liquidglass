import { Banner } from "@astryxdesign/core/Banner";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { supportsLens } from "@myna/liquidglass";
import { useAtom, useAtomValue } from "jotai";
import { lensAtom, readingAtom } from "../state";
import { Code, Eyebrow, Hint, Lead, Mono } from "./parts";

const FOUR = `.player {
  background: var(--glass-tint);
  backdrop-filter: var(--glass-blur) var(--glass-lens);
  box-shadow: var(--glass-edge);
  color: var(--glass-ink);
}`;

export function Declarations() {
  const r = useAtomValue(readingAtom);
  const light = r?.ink === "light";
  const tint = Math.round((r?.tint ?? 0.12) * 100);
  const [lens, setLens] = useAtom(lensAtom);
  const filterOk = supportsLens();
  const running = lens === "auto" ? (filterOk ? "filter" : "canvas") : lens;
  return (
    <>
      <Eyebrow>00 Four declarations</Eyebrow>
      <Lead>
        Any component turns to glass by trading four declarations for the material’s tokens.
      </Lead>
      <Code code={FOUR} />
      <div style={{ marginTop: 24 }}>
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
      <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 14 }}>
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
        CPU, which every browser can do. Drag the card across the wallpaper, or move the pointer to
        stir the liquid. The sun button, the tint pill and the card are all the same material.
      </Hint>
      {supportsLens() ? null : (
        <div style={{ marginTop: 18 }}>
          <Banner
            status="info"
            title="Canvas lens"
            description="This browser can't run SVG filters inside backdrop-filter, so the glass refracts the liquid in a canvas instead. Glass over ordinary page content falls back to blur."
          />
        </div>
      )}
    </>
  );
}
