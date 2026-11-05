import { useSyncExternalStore } from "react";

/** Below this the stage sits above the notes instead of beside them. Matches the CSS. */
export const NARROW = "(max-width: 1039px)";

const query = typeof matchMedia === "function" ? matchMedia(NARROW) : null;

/** True on the stacked (phone and small tablet) layout. */
export function useNarrow(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      query?.addEventListener("change", onChange);
      return () => query?.removeEventListener("change", onChange);
    },
    () => query?.matches ?? false,
    () => false,
  );
}
