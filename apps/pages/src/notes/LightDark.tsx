import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { useAtomValue } from "jotai";
import { readingAtom, tintScaleAtom } from "../state";
import { Eyebrow, Hint, Lead, Mono } from "./parts";

export function LightDark() {
  const r = useAtomValue(readingAtom);
  const scale = useAtomValue(tintScaleAtom);
  const appearance = r?.ink === "light" ? "dark" : "light";
  return (
    <>
      <Eyebrow>02 Light &amp; Dark</Eyebrow>
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
          <Mono>{Math.round((r?.tint ?? 0.12) * 100)}%</Mono>{" "}
          <Mono dim>6–22% by busyness (σ {r ? r.busyness.toFixed(2) : "—"})</Mono>
        </MetadataListItem>
      </MetadataList>
      <Hint>
        Drag the card from a pale current into a deep one, or flip the wallpaper with the button in
        the corner. The slider edits only the current theme’s multiplier.
      </Hint>
    </>
  );
}
