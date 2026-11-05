import {
  createContext,
  use,
  useEffect,
  useEffectEvent,
  useState,
  type Context,
  type ReactNode,
} from "react";
import type { LensMap } from "./lens";

/** What a glass element learns about the pixels behind it. */
export interface BackdropReading {
  /** Mean relative luminance, 0–1. */
  luminance: number;
  /** Standard deviation of luminance, 0–1. How much is going on back there. */
  busyness: number;
}

/**
 * Copies the backdrop pixels under a viewport rectangle into `target`, scaled to
 * fill it. Returns false when there is nothing to copy yet.
 */
export type BackdropCapture = (rect: DOMRect, target: CanvasRenderingContext2D) => boolean;

/**
 * A source of backdrop readings. `sample` receives a viewport rectangle
 * (`getBoundingClientRect()`) and reports on whatever is painted under it.
 * `subscribe` tells the glass when it is worth looking again.
 *
 * Two optional abilities let glass refract the backdrop itself where the browser
 * can't (anything but Chromium): `capture` hands over the pixels, and `frame`
 * calls back once per animation frame, right after the backdrop is drawn.
 */
export interface BackdropSource {
  sample(rect: DOMRect): BackdropReading | null;
  subscribe(listener: () => void): () => void;
  capture?: BackdropCapture;
  frame?(listener: () => void): () => void;
  /**
   * The backdrop bends itself under `el` while it is visible, so the glass needs no copy
   * of its pixels. `<Liquid>` does this inside its own WebGL pass. Returns an unregister
   * function. Takes precedence over `capture`.
   */
  refract?(el: HTMLElement, lens: BackdropLens): () => void;
}

/** What a backdrop needs to bend itself under a glass element. */
export interface BackdropLens {
  map: LensMap;
  /** Corner radius, CSS px. */
  radius: number;
  dispersion: number;
  /** The glass's backdrop filter: blur in CSS px, saturation, brightness. */
  blur: number;
  saturate: number;
  brightness: number;
}

export const BackdropContext: Context<BackdropSource | null> = createContext<BackdropSource | null>(
  null,
);

/** The nearest backdrop, if any. `<Glass ink="auto">` uses this. */
export function useBackdrop(): BackdropSource | null {
  return use(BackdropContext);
}

export interface BackdropProps {
  /** Reports on the pixels under a viewport rectangle. */
  sample: (rect: DOMRect) => BackdropReading | null;
  /**
   * Copies the pixels under a rectangle, so glass can refract them in browsers that
   * can't run the lens as a filter. `canvasCapture(canvas)` covers a canvas.
   */
  capture?: BackdropCapture;
  /** How often glass inside re-reads, in milliseconds. Use 0 for a still backdrop. */
  interval?: number;
  children?: ReactNode;
}

/**
 * Makes any backdrop readable — an image, a video, a canvas you draw yourself.
 * `<Liquid>` provides one already; reach for this when the wallpaper is yours.
 */
export function Backdrop({ sample, capture, interval = 200, children }: BackdropProps): ReactNode {
  const read = useEffectEvent((rect: DOMRect) => sample(rect));
  const copy = useEffectEvent((rect: DOMRect, target: CanvasRenderingContext2D) =>
    capture ? capture(rect, target) : false,
  );
  // Always offered; it reports false without a `capture` prop and glass keeps its blur.
  const [source] = useState(() =>
    createSource((rect) => read(rect), { capture: (rect, target) => copy(rect, target) }),
  );
  useEffect(() => {
    source.notify();
    if (!interval) return;
    const id = setInterval(source.notify, interval);
    return () => clearInterval(id);
  }, [source, interval]);
  return <BackdropContext value={source}>{children}</BackdropContext>;
}

/** A backdrop source with a listener set; `notify` asks every glass to re-read. */
export function createSource(
  sample: (rect: DOMRect) => BackdropReading | null,
  extra: Pick<BackdropSource, "capture" | "frame" | "refract"> = {},
): BackdropSource & { notify: () => void } {
  const listeners = new Set<() => void>();
  return {
    sample,
    ...extra,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    notify() {
      for (const l of listeners) l();
    },
  };
}

/** Copies a canvas (2D or WebGL with `preserveDrawingBuffer`) for `<Backdrop capture>`. */
export function canvasCapture(canvas: HTMLCanvasElement): BackdropCapture {
  return (rect, target) => drawRegion(canvas, rect, target);
}

/** Draws the part of `canvas` under a viewport rectangle into `target`. */
export function drawRegion(
  canvas: HTMLCanvasElement,
  rect: DOMRect,
  target: CanvasRenderingContext2D,
): boolean {
  const box = canvas.getBoundingClientRect();
  if (!box.width || !box.height || !canvas.width) return false;
  const kx = canvas.width / box.width;
  const ky = canvas.height / box.height;
  target.drawImage(
    canvas,
    (rect.left - box.left) * kx,
    (rect.top - box.top) * ky,
    rect.width * kx,
    rect.height * ky,
    0,
    0,
    target.canvas.width,
    target.canvas.height,
  );
  return true;
}

/**
 * Reads a 2D canvas (or anything drawn into one) under a viewport rectangle.
 * Pass the canvas that is painted behind the glass.
 */
export function canvasSampler(
  canvas: HTMLCanvasElement,
): (rect: DOMRect) => BackdropReading | null {
  return (rect) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const kx = canvas.width / box.width;
    const ky = canvas.height / box.height;
    const x0 = clamp(Math.floor((rect.left - box.left) * kx), 0, canvas.width - 1);
    const y0 = clamp(Math.floor((rect.top - box.top) * ky), 0, canvas.height - 1);
    const x1 = clamp(Math.ceil((rect.right - box.left) * kx), x0 + 1, canvas.width);
    const y1 = clamp(Math.ceil((rect.bottom - box.top) * ky), y0 + 1, canvas.height);
    return measure(ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data, x1 - x0, y1 - y0);
  };
}

/** Mean and spread of luminance over RGBA pixels, subsampled to ~3000 points. */
export function measure(data: ArrayLike<number>, width: number, height: number): BackdropReading {
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 3000)));
  let n = 0;
  let s = 0;
  let s2 = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      s += l;
      s2 += l * l;
      n++;
    }
  }
  const luminance = n ? s / n : 0;
  return { luminance, busyness: Math.sqrt(Math.max(0, (n ? s2 / n : 0) - luminance * luminance)) };
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
