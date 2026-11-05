import { atom } from "jotai";
import type { GlassReading, Tint } from "@myna/liquidglass";

/** The wallpaper: the sun/moon button flips it, the liquid cross-fades. */
export const themeAtom = atom<"light" | "dark">("light");

/**
 * The tint pill: `"auto"` (follow the wallpaper) or a fixed wash, kept apart for
 * light glass (dark ink) and dark glass (light ink). Every glass on the stage uses it.
 */
export const tintAtom = atom<{ light: Tint; dark: Tint }>({ light: "auto", dark: "auto" });

/** The card's latest read of the liquid under it. */
export const readingAtom = atom<GlassReading | null>(null);

/** How the rim lens runs: the browser's filter, the canvas fallback, or whichever fits. */
type LensMode = "auto" | "filter" | "canvas" | "off";
// `?lens=canvas|filter|off` picks the starting mode (handy for measuring a browser).
const lensParam =
  typeof location === "undefined" ? null : new URLSearchParams(location.search).get("lens");
export const lensAtom = atom<LensMode>(
  lensParam === "canvas" || lensParam === "filter" || lensParam === "off" ? lensParam : "auto",
);

/** Where the card sits on the stage (top-left, px). The layer stack takes off from here. */
export const cardAtom = atom<{ x: number; y: number } | null>(null);

/** The card's °C/°F choice, shared so the stack's copy of the card shows the same. */
export const unitAtom = atom<"c" | "f">("c");

/** The card pulled apart into its six layers (the toggle in the stage's top-right corner). */
export const explodedAtom = atom(
  typeof location !== "undefined" && new URLSearchParams(location.search).has("layers"),
);
