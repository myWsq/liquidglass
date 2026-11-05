/**
 * The rim lens.
 *
 * A glass slab bends what is behind it hardest at its edge. For every pixel we take
 * d, the distance to the rounded-rect edge, and look inward by
 *
 *     offset = refraction × rim × (1 − d / rim) ^ falloff
 *
 * plus a small pull toward the middle (`magnify`), which enlarges the centre. The
 * offsets are packed into an image for `feDisplacementMap`; the filter displaces
 * red, green and blue by slightly different amounts, which splits colour at the rim.
 */

export interface LensOptions {
  /** Element width in CSS pixels. */
  width: number;
  /** Element height in CSS pixels. */
  height: number;
  /** Corner radius in CSS pixels. */
  radius: number;
  /** Width of the bending band along the edge. */
  rim?: number;
  /** How far the rim reaches inward, as a multiple of `rim`. */
  refraction?: number;
  /** How quickly the bend eases off away from the edge. */
  falloff?: number;
  /** Pull toward the middle, as a fraction of the distance to it. */
  magnify?: number;
}

export interface LensMap {
  width: number;
  height: number;
  /** Inward offsets in CSS pixels, interleaved x, y per pixel. */
  offsets: Float32Array;
  /** The `scale` that makes `feDisplacementMap` reproduce `offsets` from `url`. */
  scale: number;
  /** The offsets encoded as a PNG data URL (R = x, G = y, 0.5 = no shift). */
  url: string;
}

const cache = new Map<string, LensMap>();
const CACHE_LIMIT = 32;

/** Builds (or returns a cached) displacement map for a rounded rectangle. */
export function createLensMap(options: LensOptions): LensMap {
  const w = Math.max(1, Math.round(options.width));
  const h = Math.max(1, Math.round(options.height));
  const half = Math.min(w, h) / 2;
  const r = Math.min(Math.max(0, options.radius), half);
  const rim = Math.min(options.rim ?? 44, half);
  const refraction = options.refraction ?? 1.1;
  const falloff = options.falloff ?? 2.6;
  const magnify = options.magnify ?? 0.05;

  const key = [w, h, r, rim, refraction, falloff, magnify].join("|");
  const hit = cache.get(key);
  if (hit) return hit;

  const offsets = new Float32Array(w * h * 2);
  const hw = w / 2;
  const hh = h / 2;
  // Normals come from a rounder copy of the shape, so they turn smoothly at corners.
  const rn = Math.min(Math.max(r, rim), half);
  let max = 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x + 0.5 - hw;
      const dy = y + 0.5 - hh;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const qx = ax - (hw - r);
      const qy = ay - (hh - r);
      const outside =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
      const d = Math.max(0, -outside);

      const nx0 = ax - (hw - rn);
      const ny0 = ay - (hh - rn);
      let nx: number;
      let ny: number;
      if (nx0 > 0 && ny0 > 0) {
        const l = Math.hypot(nx0, ny0);
        nx = nx0 / l;
        ny = ny0 / l;
      } else if (nx0 > ny0) {
        nx = 1;
        ny = 0;
      } else {
        nx = 0;
        ny = 1;
      }
      nx *= Math.sign(dx) || 1;
      ny *= Math.sign(dy) || 1;

      const m = d < rim ? refraction * rim * Math.pow(1 - d / rim, falloff) : 0;
      const ox = -nx * m - magnify * dx;
      const oy = -ny * m - magnify * dy;
      const i = (y * w + x) * 2;
      offsets[i] = ox;
      offsets[i + 1] = oy;
      max = Math.max(max, Math.abs(ox), Math.abs(oy));
    }
  }

  // feDisplacementMap moves each pixel by scale × (channel − 0.5).
  const scale = max * 2.02;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  let url = "";
  if (ctx) {
    const img = ctx.createImageData(w, h);
    for (let p = 0, q = 0; p < w * h; p++, q += 2) {
      img.data[p * 4] = clampByte((offsets[q] / scale + 0.5) * 255);
      img.data[p * 4 + 1] = clampByte((offsets[q + 1] / scale + 0.5) * 255);
      img.data[p * 4 + 2] = 128;
      img.data[p * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    url = canvas.toDataURL();
  }

  const map: LensMap = { width: w, height: h, offsets, scale, url };
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  cache.set(key, map);
  return map;
}

export interface ApplyLensOptions {
  /** Device pixels per CSS pixel in `image`. */
  pixelRatio?: number;
  /** Red bends `1 + dispersion` as far as green, blue `1 − dispersion`. */
  dispersion?: number;
  /** Write into this image (same size as `image`) instead of allocating one. */
  into?: ImageData;
}

/**
 * Applies a lens map to pixels on the CPU. The browser does this with an SVG filter;
 * this is for snapshots, diagrams, and anywhere a filter can't run.
 */
export function applyLens(
  image: ImageData,
  map: LensMap,
  options: ApplyLensOptions = {},
): ImageData {
  const dpr = options.pixelRatio ?? 1;
  const k = options.dispersion ?? 0.15;
  const gain = [1 + k, 1, 1 - k];
  const { width: W, height: H, data: src } = image;
  const out =
    options.into && options.into.width === W && options.into.height === H
      ? options.into
      : new ImageData(W, H);
  const dst = out.data;
  for (let y = 0; y < H; y++) {
    const my = Math.min(map.height - 1, (y / dpr) | 0);
    for (let x = 0; x < W; x++) {
      const mi = (my * map.width + Math.min(map.width - 1, (x / dpr) | 0)) * 2;
      const ox = map.offsets[mi] * dpr;
      const oy = map.offsets[mi + 1] * dpr;
      const di = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) {
        const sx = clampInt(Math.round(x + ox * gain[c]), W - 1);
        const sy = clampInt(Math.round(y + oy * gain[c]), H - 1);
        dst[di + c] = src[(sy * W + sx) * 4 + c];
      }
      dst[di + 3] = 255;
    }
  }
  return out;
}

/**
 * Whether this browser can run an SVG filter inside `backdrop-filter`.
 * Today that is Chromium only; elsewhere the glass keeps its blur and skips the lens.
 */
export function supportsLens(): boolean {
  if (typeof navigator === "undefined") return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } })
    .userAgentData?.brands;
  if (brands) return brands.some((b) => /Chromium/.test(b.brand));
  const ua = navigator.userAgent;
  return /Chrome\/|Chromium\//.test(ua) && !/Firefox|FxiOS|CriOS|EdgiOS/.test(ua);
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

function clampInt(v: number, max: number): number {
  return v < 0 ? 0 : v > max ? max : v;
}
