import { Banner } from "@astryxdesign/core/Banner";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { supportsLens, type Tint } from "@myna/liquidglass";
import * as stylex from "@stylexjs/stylex";
import { useAtom, useAtomValue } from "jotai";
import { lensAtom, readingAtom, themeAtom, tintAtom } from "../state";
import { Code, Eyebrow, Hint, Lead, Mono, useListLabel } from "./parts";

const TOKENS = `.my-card {
  background: var(--glass-tint);
  backdrop-filter:
    var(--glass-blur) var(--glass-lens);
  box-shadow: var(--glass-edge);
  color: var(--glass-ink);
}`;

const tintCode = (t: Tint) => (t === "auto" ? '"auto"' : String(t));

/** The card on the stage, as you'd write it, with the props it has right now. */
function cardCode(theme: string, lens: string, tint: { light: Tint; dark: Tint }) {
  const props: string[] = [];
  if (tint.light !== "auto" || tint.dark !== "auto")
    props.push(`tint={{ light: ${tintCode(tint.light)}, dark: ${tintCode(tint.dark)} }}`);
  if (lens !== "auto") props.push(`lens="${lens}"`);
  const open = props.length
    ? `<Glass\n    as="section"\n    ${props.join("\n    ")}\n  >`
    : `<Glass as="section">`;
  return `import { Glass, Ink, Liquid } from "@myna/liquidglass";
import "@myna/liquidglass/styles.css";

<Liquid theme="${theme}">
  ${open}
    <Ink as="h3">Kyoto</Ink>
    <Ink as="p">23°</Ink>
    <Ink as="p" tone="secondary">H:26° L:17°</Ink>
    {/* … */}
  </Glass>
</Liquid>`;
}

/** The four declarations, and how the card reads the wallpaper to fill them in. */
export function Material() {
  const r = useAtomValue(readingAtom);
  const tintSetting = useAtomValue(tintAtom);
  const theme = useAtomValue(themeAtom);
  const [lens, setLens] = useAtom(lensAtom);
  const listLabel = useListLabel();
  const light = r?.ink === "light";
  const appearance = light ? "dark" : "light";
  const tint = Math.round((r?.tint ?? 0.12) * 100);
  const filterOk = supportsLens();
  const running = lens === "auto" ? (filterOk ? "filter" : "canvas") : lens;
  return (
    <>
      <Eyebrow>The component</Eyebrow>
      <Lead>
        Wrap any element in <code>&lt;Glass&gt;</code> and it becomes the material. Inside{" "}
        <code>&lt;Liquid&gt;</code> it reads the wallpaper to pick its ink and wash.
      </Lead>
      <Code code={cardCode(theme, lens, tintSetting)} language="tsx" />
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
        This is the card on the stage: change the lens or the tint and its props follow. The SVG
        filter is Chromium’s; on the canvas lens the liquid bends itself under the glass, on the
        GPU, which every browser can do.
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
        <Eyebrow>Under the hood</Eyebrow>
        <Lead>
          <code>&lt;Glass&gt;</code> fills four tokens. Any element can use them, React or not.
        </Lead>
        <Code code={TOKENS} />
      </div>
      <div {...stylex.props(styles.block)}>
        <MetadataList label={listLabel}>
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

      <div {...stylex.props(styles.section)}>
        <Eyebrow>Light &amp; dark</Eyebrow>
        <Lead>
          The card reads the wallpaper under it and picks its ink. The tint’s strength is kept apart
          for light and dark.
        </Lead>
        <MetadataList label={listLabel}>
          <MetadataListItem label="luminance">
            <Mono>{r ? r.luminance.toFixed(2) : "—"}</Mono>{" "}
            <Mono dim>the wallpaper under the card</Mono>
          </MetadataListItem>
          <MetadataListItem label="ink">
            <Mono>{r?.ink ?? "dark"}</Mono> <Mono dim>light below 0.5</Mono>
          </MetadataListItem>
          <MetadataListItem label="tint">
            <Mono dim={appearance !== "light"}>light {pctOrAuto(tintSetting.light)}</Mono> ·{" "}
            <Mono dim={appearance !== "dark"}>dark {pctOrAuto(tintSetting.dark)}</Mono>{" "}
            <Mono dim>set per theme</Mono>
          </MetadataListItem>
          <MetadataListItem label="wash">
            <Mono>{tint}%</Mono>{" "}
            <Mono dim>6–22% by busyness (σ {r ? r.busyness.toFixed(2) : "—"})</Mono>
          </MetadataListItem>
        </MetadataList>
        <Hint>
          Drag the card from a pale current into a deep one, or flip the wallpaper with the sun
          button. Switch Auto off on the tint pill to set the wash by hand; it is kept apart for
          light and dark glass. The layers button beside the sun pulls the card apart into its six
          layers. The buttons, the pill and the card are all the same material.
        </Hint>
      </div>
    </>
  );
}

const pctOrAuto = (t: Tint) => (t === "auto" ? "auto" : `${Math.round(t * 100)}%`);

const styles = stylex.create({
  block: { marginTop: 24 },
  switch: { marginTop: 22, display: "flex", alignItems: "center", gap: 14 },
  banner: { marginTop: 18 },
  section: { marginTop: 44, paddingTop: 28, borderTop: "1px solid #1a1b1f" },
});
