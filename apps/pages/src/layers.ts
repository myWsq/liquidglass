export const LAYERS = [
  {
    key: "shadow",
    name: "Shadow",
    text: "Lifts the card off the wallpaper, faintly: the rim does most of the work.",
    code: "box-shadow:\n  0 0 0 .5px rgb(0 0 0 / .06),\n  0 6px 24px rgb(0 0 0 / .08);",
  },
  {
    key: "blur",
    name: "Blur & light",
    text: "Softens what is behind just a little and deepens its colors, so the glass stays clear and vivid.",
    code: "backdrop-filter:\n  blur(2px) saturate(1.8)\n  brightness(1.06);",
  },
  {
    key: "lens",
    name: "Rim lens",
    text: "A thick slab: a wide 44px rim bends the wallpaper hard at the edge and eases off inward, the middle magnifies it a little, and red bends further than blue.",
    code: "backdrop-filter: … url(#lens);\n\n// how far each point looks inward\noffset = 1.1 × rim\n       × (1 − d / rim)^2.6\n       + 5% toward the middle\n// red ×1.15, green ×1, blue ×.85",
  },
  {
    key: "tint",
    name: "Tint",
    text: "Only a thin white wash, thicker over busy wallpaper so the text holds. The color comes from behind.",
    code: "background: rgb(255 255 255 / 6%–22%);",
  },
  {
    key: "rim",
    name: "Rim light",
    text: "A bright line where the light hits the top left, a softer one at the bottom right, and a glow just inside.",
    code: "box-shadow:\n  inset 1.5px 1.5px 1px -1px\n    #fff,\n  inset -1.5px -1.5px 1px -1px\n    rgb(255 255 255 / .55);\nbackground-image:\n  radial-gradient(at 0 0,\n    rgb(255 255 255 / .3),\n    transparent 55%);",
  },
  {
    key: "ink",
    name: "Ink",
    text: "One ink in two strengths, multiplied into the glass so it takes on its color.",
    code: "color: rgb(0 0 0 / 86%);\n.sub {\n  color: rgb(60 60 67 / 70%);\n}\nmix-blend-mode: multiply;",
  },
] as const;

export type LayerKey = (typeof LAYERS)[number]["key"];

export const isLayerKey = (v: unknown): v is LayerKey => LAYERS.some((l) => l.key === v);
