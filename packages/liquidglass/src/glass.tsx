import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type Ref,
} from "react";
import { clamp, useBackdrop, type BackdropReading } from "./backdrop";
import { applyLens, createLensMap, supportsLens, type LensMap } from "./lens";

/** Dark ink reads on light glass; light ink reads on dark glass. */
export type Ink = "dark" | "light";

/** A wash strength, 0–1, or `"auto"` to follow the backdrop. */
export type Tint = number | "auto";

/** What a glass element decided after reading its backdrop. */
export interface GlassReading extends BackdropReading {
  ink: Ink;
  /** The white (or night) wash actually applied, 0–1. */
  tint: number;
}

export interface GlassOwnProps<T extends ElementType = "div"> {
  /** Element to render. Defaults to `div`; its props are accepted too. */
  as?: T;
  ref?: Ref<HTMLElement>;
  /** Corner radius in pixels, or `"pill"` for fully rounded ends. */
  radius?: number | "pill";
  /** Width of the refracting band along the edge, in pixels. */
  rim?: number;
  /** How far the rim reaches inward, as a multiple of `rim`. */
  refraction?: number;
  /** How quickly the bend eases off away from the edge. */
  falloff?: number;
  /** Pull toward the middle, which magnifies the centre. */
  magnify?: number;
  /** Colour split at the rim: red bends `1 + d`, blue `1 − d` as far as green. */
  dispersion?: number;
  /** Backdrop blur in pixels. Kept small on purpose: glass is clear. */
  blur?: number;
  saturate?: number;
  brightness?: number;
  /**
   * Strength of the wash, 0–1. `"auto"` goes from 6% to 22% as the backdrop gets
   * busier, so text holds; without a backdrop it settles at 12%. Pass
   * `{ light, dark }` to keep light glass (dark ink) and dark glass (light ink) apart;
   * either side may be `"auto"`, and a missing side is `"auto"`.
   */
  tint?: Tint | { light?: Tint; dark?: Tint };
  /** Multiplier on the wash, per appearance — light glass and dark glass. */
  tintScale?: number | { light?: number; dark?: number };
  /** `"auto"` picks dark ink over bright backdrops and light ink over dim ones. */
  ink?: Ink | "auto";
  /**
   * How the rim lens runs. `"filter"` is an SVG filter in `backdrop-filter` (Chromium).
   * `"canvas"` copies the backdrop and refracts it in a canvas, which works in every
   * browser but needs a backdrop that can hand over its pixels (`<Liquid>`, or
   * `<Backdrop capture>`). `"auto"` (and `true`) picks the filter where it runs and
   * the canvas elsewhere; `false` turns the lens off.
   */
  lens?: boolean | "auto" | "filter" | "canvas";
  /** Called whenever the glass reads its backdrop. */
  onReading?: (reading: GlassReading) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export type GlassProps<T extends ElementType = "div"> = GlassOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof GlassOwnProps<T>>;

type Size = { w: number; h: number };
type LensMode = "filter" | "canvas" | "off";

/** Backdrop margin copied around the canvas lens, so its blur has pixels to pull in. */
const PAD = 6;

/**
 * Liquid glass. Six layers on any element: shadow, blur and light, the rim lens,
 * a thin tint, rim light, and ink. Inside a `<Liquid>` or `<Backdrop>` it reads the
 * wallpaper under it and chooses its ink and wash.
 */
export function Glass<T extends ElementType = "div">({
  as,
  ref,
  radius = 28,
  rim = 44,
  refraction = 1.1,
  falloff = 2.6,
  magnify = 0.05,
  dispersion = 0.15,
  blur = 2,
  saturate = 1.8,
  brightness = 1.06,
  tint = "auto",
  tintScale = 1,
  ink = "auto",
  lens = "auto",
  onReading,
  className,
  style,
  children,
  ...rest
}: GlassProps<T>): ReactNode {
  const As: ElementType = as ?? "div";
  const node = useRef<HTMLElement | null>(null);
  const filterId = "liquidglass-" + useId().replace(/[^\w-]/g, "");
  const [size, setSize] = useState<Size | null>(null);
  const [mode, setMode] = useState<LensMode>("off");
  const refractionCanvas = useRef<HTMLCanvasElement>(null);
  const backdrop = useBackdrop();

  useLayoutEffect(() => {
    const canvasOk = backdrop?.refract !== undefined || backdrop?.capture !== undefined;
    const pick: LensMode =
      lens === false
        ? "off"
        : lens === "filter" || ((lens === true || lens === "auto") && supportsLens())
          ? "filter"
          : canvasOk
            ? "canvas"
            : "off";
    setMode(pick);
  }, [lens, backdrop]);

  useLayoutEffect(() => {
    const el = node.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cornerRadius = size ? (radius === "pill" ? Math.min(size.w, size.h) / 2 : radius) : 0;
  const map: LensMap | null =
    mode !== "off" && size && size.w > 1 && size.h > 1
      ? createLensMap({
          width: size.w,
          height: size.h,
          radius: cornerRadius,
          rim,
          refraction,
          falloff,
          magnify,
        })
      : null;

  const scaleFor = (appearance: "light" | "dark") =>
    typeof tintScale === "number" ? tintScale : (tintScale[appearance] ?? 1);
  const scaleLight = scaleFor("light");
  const scaleDark = scaleFor("dark");
  // Dark ink sits on light glass, light ink on dark glass.
  const tintLight: Tint = typeof tint === "object" ? (tint.light ?? "auto") : tint;
  const tintDark: Tint = typeof tint === "object" ? (tint.dark ?? "auto") : tint;
  const fixedInk: Ink = ink === "auto" ? "dark" : ink;
  const fixedSpec = fixedInk === "dark" ? tintLight : tintDark;
  const fixedTint = clamp(
    (fixedSpec === "auto" ? 0.12 : fixedSpec) * (fixedInk === "dark" ? scaleLight : scaleDark),
    0,
    0.75,
  );
  const reads = backdrop !== null;

  // Reading the backdrop writes straight to the element: it runs several times a
  // second while the wallpaper moves, and nothing in the React tree depends on it.
  const inkNow = useRef<Ink>(fixedInk);
  const read = useEffectEvent(() => {
    const el = node.current;
    if (!el || !backdrop) return;
    const r = backdrop.sample(el.getBoundingClientRect());
    if (!r) return;
    let next: Ink = ink === "auto" ? inkNow.current : ink;
    if (ink === "auto") {
      if (next === "dark" && r.luminance < 0.47) next = "light";
      else if (next === "light" && r.luminance > 0.53) next = "dark";
    }
    inkNow.current = next;
    const spec = next === "dark" ? tintLight : tintDark;
    const base = spec === "auto" ? 0.06 + 0.16 * clamp((r.busyness - 0.04) / 0.26, 0, 1) : spec;
    const alpha = clamp(base * (next === "dark" ? scaleLight : scaleDark), 0, 0.75);
    el.dataset.ink = next;
    el.style.setProperty("--lg-tint-a", alpha.toFixed(3));
    onReading?.({ ...r, ink: next, tint: alpha });
  });

  useEffect(() => {
    if (!backdrop) return;
    read();
    return backdrop.subscribe(read);
  }, [backdrop]);

  // Settings changed: re-read now rather than at the next tick.
  useEffect(() => {
    if (backdrop) read();
  }, [backdrop, ink, tintLight, tintDark, scaleLight, scaleDark]);

  // The canvas lens. A backdrop that can bend itself (`<Liquid>`) does it under the glass
  // in its own GPU pass; anything else hands over a copy of its pixels each frame, which
  // the glass bends on the CPU with the same map the filter uses and lets CSS blur.
  useEffect(() => {
    const el = node.current;
    if (mode !== "canvas" || !el || !map || !backdrop) return;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    if (backdrop.refract) {
      const stop = backdrop.refract(el, {
        map,
        radius: cornerRadius,
        dispersion,
        blur,
        saturate,
        brightness,
      });
      el.dataset.lens = "backdrop";
      return () => {
        stop();
        delete el.dataset.lens;
      };
    }
    const cv = refractionCanvas.current;
    const ctx = cv?.getContext("2d", { willReadFrequently: true });
    if (!cv || !ctx || !backdrop.capture) return;
    cv.width = map.width + PAD * 2;
    cv.height = map.height + PAD * 2;
    let buffer: ImageData | undefined;
    const paint = () => {
      const r = el.getBoundingClientRect();
      const area = new DOMRect(r.x - PAD, r.y - PAD, r.width + PAD * 2, r.height + PAD * 2);
      if (!backdrop.capture?.(area, ctx)) return;
      const src = ctx.getImageData(PAD, PAD, map.width, map.height);
      buffer = applyLens(src, map, { dispersion, into: buffer });
      ctx.putImageData(buffer, PAD, PAD);
      el.dataset.lens = "canvas";
    };
    paint();
    const stop = backdrop.frame ? backdrop.frame(paint) : backdrop.subscribe(paint);
    return () => {
      stop();
      delete el.dataset.lens;
    };
  }, [mode, map, backdrop, dispersion, cornerRadius, blur, saturate, brightness]);

  const vars = {
    "--lg-radius": radius === "pill" ? "9999px" : `${radius}px`,
    "--lg-blur": `${blur}px`,
    "--lg-saturate": saturate,
    "--lg-brightness": brightness,
    "--glass-lens": map && mode === "filter" ? `url(#${filterId})` : " ",
    ...(reads ? null : { "--lg-tint-a": fixedTint.toFixed(3) }),
    ...style,
  } as CSSProperties;

  const setRef = (el: HTMLElement | null) => {
    node.current = el;
    if (typeof ref === "function") return ref(el);
    if (ref) ref.current = el;
  };

  return (
    <As
      {...rest}
      ref={setRef}
      className={className ? `liquidglass ${className}` : "liquidglass"}
      data-ink={reads ? undefined : fixedInk}
      style={vars}
    >
      {map && mode === "filter" ? (
        <LensFilter id={filterId} map={map} dispersion={dispersion} />
      ) : null}
      {mode === "canvas" ? (
        <span className="liquidglass-refraction" aria-hidden="true">
          <canvas ref={refractionCanvas} />
        </span>
      ) : null}
      {children}
    </As>
  );
}

function LensFilter({
  id,
  map,
  dispersion,
}: {
  id: string;
  map: LensMap;
  dispersion: number;
}): ReactNode {
  const channels = [
    { name: "r", gain: 1 + dispersion, keep: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" },
    { name: "g", gain: 1, keep: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" },
    { name: "b", gain: 1 - dispersion, keep: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" },
  ];
  return (
    <svg className="liquidglass-defs" aria-hidden="true" focusable="false" width="0" height="0">
      <filter
        id={id}
        x="0"
        y="0"
        width={map.width}
        height={map.height}
        filterUnits="userSpaceOnUse"
        primitiveUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={map.url}
          x="0"
          y="0"
          width={map.width}
          height={map.height}
          preserveAspectRatio="none"
          result="map"
        />
        {channels.map((c) => [
          <feDisplacementMap
            key={c.name + "d"}
            in="SourceGraphic"
            in2="map"
            scale={(map.scale * c.gain).toFixed(2)}
            xChannelSelector="R"
            yChannelSelector="G"
            result={c.name + "d"}
          />,
          <feColorMatrix
            key={c.name}
            in={c.name + "d"}
            type="matrix"
            values={c.keep}
            result={c.name}
          />,
        ])}
        <feBlend in="r" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b" mode="screen" />
      </filter>
    </svg>
  );
}
