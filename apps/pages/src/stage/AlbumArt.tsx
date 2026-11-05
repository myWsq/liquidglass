import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

const SIZE = 62;

/** Halftone cover: dots sized by a soft silhouette. */
export function AlbumArt() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = SIZE * dpr;
    cv.height = SIZE * dpr;
    const c = cv.getContext("2d");
    if (!c) return;
    c.scale(dpr, dpr);
    const g = c.createLinearGradient(0, 0, SIZE, SIZE);
    g.addColorStop(0, "#2b3f78");
    g.addColorStop(1, "#0c1430");
    c.fillStyle = g;
    c.fillRect(0, 0, SIZE, SIZE);
    const blob = (u: number, v: number, cu: number, cv2: number, ru: number, rv: number) =>
      Math.exp(-(((u - cu) / ru) ** 2 + ((v - cv2) / rv) ** 2));
    c.fillStyle = "rgba(214,226,255,.92)";
    for (let y = 2; y < SIZE; y += 3.4) {
      for (let x = 2; x < SIZE; x += 3.4) {
        const u = x / SIZE;
        const v = y / SIZE;
        const shape = Math.min(
          1,
          Math.max(
            blob(u, v, 0.46, 0.3, 0.1, 0.11),
            blob(u, v, 0.44, 0.72, 0.17, 0.26),
            blob(u, v, 0.62, 0.48, 0.05, 0.2) * 0.8,
          ) +
            0.18 * (1 - v),
        );
        const r = 1.55 * shape;
        if (r < 0.18) continue;
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      }
    }
  }, []);
  return <canvas ref={ref} {...stylex.props(styles.art)} />;
}

const styles = stylex.create({
  art: {
    width: SIZE,
    height: SIZE,
    flexShrink: 0,
    display: "block",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgb(0 0 0 / .18)",
  },
});
