import { atom } from "jotai";
import type { GlassReading } from "@myna/liquidglass";

/** The wallpaper: the sun/moon button flips it, the liquid cross-fades. */
export const themeAtom = atom<"light" | "dark">("light");

/** The tint pill's multiplier, kept apart for light glass and dark glass. */
export const tintScaleAtom = atom({ light: 1, dark: 1 });

/** The player's latest read of the liquid under it. */
export const readingAtom = atom<GlassReading | null>(null);

/** How the rim lens runs: the browser's filter, the canvas fallback, or whichever fits. */
export const lensAtom = atom<"auto" | "filter" | "canvas">("auto");
