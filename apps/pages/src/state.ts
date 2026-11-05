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

/** Where the card sits on the stage (top-left, px). The layer stack takes off from here. */
export const cardAtom = atom<{ x: number; y: number } | null>(null);

/** The card's playback, shared so the stack's copy of the card shows the same moment. */
export const playbackAtom = atom({ t: 22, playing: true });
export const DURATION = 173;
