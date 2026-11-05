import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { BackdropContext, type BackdropReading } from "./backdrop";
import { LiquidEngine, type LiquidColors, type LiquidSettings } from "./liquid-engine";

export interface LiquidHandle {
  /** The canvas the liquid is drawn into. */
  readonly canvas: HTMLCanvasElement | null;
  /** Whether the liquid moves (WebGL2) or is a still CPU render. */
  readonly live: boolean;
  /** Draws the current frame now. Read the canvas in the same task, e.g. `drawImage`. */
  draw(): void;
  /** Luminance and busyness under a viewport rectangle. */
  sample(rect: DOMRect): BackdropReading | null;
}

export interface LiquidProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<LiquidHandle>;
  /** Cross-fades between the light and dark palettes. */
  theme?: "light" | "dark";
  /** Override any palette colour, per theme. */
  colors?: { light?: Partial<LiquidColors>; dark?: Partial<LiquidColors> };
  /** Flow speed multiplier. Defaults to 1. */
  speed?: number;
  /** How many currents fit on screen. Defaults to 3.4. */
  scale?: number;
  /** How wet and three-dimensional the surface looks. Defaults to 0.05. */
  bump?: number;
  /** Freeze the flow. `prefers-reduced-motion` freezes it as well. */
  paused?: boolean;
  /** Render resolution as a fraction of device pixels. Defaults to 0.75. */
  resolution?: number;
  /** Class and style for the canvas, e.g. to blur the wallpaper behind a dialog. */
  canvasProps?: { className?: string; style?: CSSProperties };
  children?: ReactNode;
}

/**
 * A flowing liquid wallpaper drawn by a WebGL2 shader. Glass placed inside reads
 * the liquid under it, so `<Glass ink="auto">` keeps its text legible as the
 * currents pass. The currents drift on their own.
 */
export function Liquid({
  ref,
  theme = "light",
  colors,
  speed = 1,
  scale = 3.4,
  bump = 0.05,
  paused = false,
  resolution = 0.75,
  canvasProps,
  className,
  children,
  ...rest
}: LiquidProps): ReactNode {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<LiquidEngine | null>(null);
  const settings: LiquidSettings = {
    theme,
    colors,
    speed,
    scale,
    bump,
    paused,
    resolution,
  };
  const initial = useEffectEvent(() => settings);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const e = new LiquidEngine(el, initial());
    e.start();
    const ro = new ResizeObserver(() => e.resize());
    ro.observe(el);
    // Nothing to draw while the liquid is scrolled out of view (hidden tabs pause on
    // their own): stop the frame loop until it is back.
    let running = true;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === running) return;
      running = entry.isIntersecting;
      if (running) e.start();
      else e.stop();
    });
    io.observe(el);
    setEngine(e);
    return () => {
      io.disconnect();
      ro.disconnect();
      e.destroy();
      setEngine(null);
    };
  }, []);

  useEffect(() => {
    engine?.update(settings);
  });

  useImperativeHandle(
    ref,
    () => ({
      get canvas() {
        return canvas.current;
      },
      get live() {
        return engine?.live ?? false;
      },
      draw: () => engine?.draw(),
      sample: (rect) => engine?.sample(rect) ?? null,
    }),
    [engine],
  );

  return (
    <div {...rest} className={className ? `liquidglass-liquid ${className}` : "liquidglass-liquid"}>
      <canvas
        ref={canvas}
        aria-hidden="true"
        className={
          canvasProps?.className
            ? `liquidglass-liquid-canvas ${canvasProps.className}`
            : "liquidglass-liquid-canvas"
        }
        style={canvasProps?.style}
      />
      <BackdropContext value={engine?.source ?? null}>{children}</BackdropContext>
    </div>
  );
}
