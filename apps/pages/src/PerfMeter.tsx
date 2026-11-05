import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

/**
 * Frame rate and 95th-percentile frame time, over the last two seconds. Shown only
 * with `?perf` in the URL, so a browser that can't be scripted (Safari) can still be
 * measured from a screenshot.
 */
export function PerfMeter() {
  const out = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let gaps: number[] = [];
    let shown = last;
    const tick = (now: number) => {
      gaps.push(now - last);
      last = now;
      if (now - shown > 2000 && out.current) {
        const sorted = [...gaps].sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
        out.current.textContent = `${Math.round(gaps.length / ((now - shown) / 1000))} fps · p95 ${p95.toFixed(1)} ms`;
        gaps = [];
        shown = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={out} {...stylex.props(styles.meter)}>
      measuring…
    </div>
  );
}

export const showPerf =
  typeof location !== "undefined" && new URLSearchParams(location.search).has("perf");

const styles = stylex.create({
  meter: {
    position: "fixed",
    left: 12,
    bottom: 12,
    zIndex: 10,
    paddingBlock: 6,
    paddingInline: 10,
    borderRadius: 8,
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
    fontSize: 12,
    color: "#fff",
    backgroundColor: "rgb(0 0 0 / .7)",
    pointerEvents: "none",
  },
});
