/** The six layers of the material, bottom to top, as labelled in the exploded view. */
export const LAYERS = [
  { key: "shadow", name: "Shadow", caption: "lifts it off the wallpaper" },
  { key: "blur", name: "Blur & light", caption: "softens, deepens colour" },
  { key: "lens", name: "Rim lens", caption: "bends the edge, splits colour" },
  { key: "tint", name: "Tint", caption: "a thin wash, thicker when busy" },
  { key: "rim", name: "Rim light", caption: "where the light catches" },
  { key: "ink", name: "Ink", caption: "takes on the glass's colour" },
] as const;

export type LayerKey = (typeof LAYERS)[number]["key"];
