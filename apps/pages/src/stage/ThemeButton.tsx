import * as stylex from "@stylexjs/stylex";
import { useAtom, useAtomValue } from "jotai";
import { Glass } from "@myna/liquidglass";
import { lensAtom, themeAtom, tintScaleAtom } from "../state";
import { withClass } from "../sx";
import { Icons } from "./icons";

export function ThemeButton() {
  const lens = useAtomValue(lensAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const tintScale = useAtomValue(tintScaleAtom);
  return (
    <Glass
      lens={lens}
      as="button"
      type="button"
      radius="pill"
      rim={14}
      tintScale={tintScale}
      aria-label={
        theme === "light" ? "Switch to the dark wallpaper" : "Switch to the light wallpaper"
      }
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      {...stylex.props(styles.button)}
    >
      <span {...withClass("liquidglass-ink", styles.icon)}>
        {theme === "light" ? Icons.sun : Icons.moon}
      </span>
    </Glass>
  );
}

const styles = stylex.create({
  button: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    border: "none",
    padding: 0,
    cursor: "pointer",
    zIndex: 2,
  },
  icon: { display: "grid" },
});
