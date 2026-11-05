import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";

type Style = StyleXStyles | false | null | undefined;

/** `stylex.props` plus a plain class (e.g. liquidglass' `liquidglass-ink`). */
export function withClass(extra: string, ...styles: Style[]): ReturnType<typeof stylex.props> {
  const p = stylex.props(...styles);
  return { ...p, className: p.className ? `${extra} ${p.className}` : extra };
}
