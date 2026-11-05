import type { LensMap } from "./lens";

/**
 * The rim lens on the GPU, for glass that refracts a canvas itself (every browser but
 * Chromium, and the layer diagram). One small shared WebGL2 context samples the source
 * canvas as a texture and displaces it with the lens map; the result is copied into the
 * target canvas GPU-to-GPU. Nothing is read back to the CPU, which is what made the CPU
 * lens (`applyLens`) expensive: every `getImageData` stalls until the GPU catches up.
 */

const VERT = `#version 300 es
in vec2 p;
out vec2 vUv;
void main() { vUv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;

// vUv runs top-down over the output. The lens map covers the output minus `uPad` on
// every side; the margin is copied unbent so a CSS blur has pixels to pull in.
const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSrc, uMap;
uniform vec2 uOut, uSrcSize, uOrigin, uPad;
uniform float uK, uScale, uDisp;
in vec2 vUv;
out vec4 color;
vec4 at(vec2 px) { return texture(uSrc, (uOrigin + px * uK) / uSrcSize); }
void main() {
  vec2 px = vUv * uOut;
  vec2 inner = (px - uPad) / (uOut - 2. * uPad);
  vec2 m = vec2(0.);
  if (all(greaterThanEqual(inner, vec2(0.))) && all(lessThanEqual(inner, vec2(1.))))
    m = (texture(uMap, inner).rg - .5) * uScale;
  color = vec4(at(px + m * (1. + uDisp)).r, at(px + m).g, at(px + m * (1. - uDisp)).b, 1.);
}`;

interface Shared {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  u: Record<string, WebGLUniformLocation | null>;
  src: WebGLTexture;
  maps: WeakMap<LensMap, WebGLTexture>;
  /** The source last uploaded, and when, so glass in one frame shares one upload. */
  last: { source: CanvasImageSource | null; at: number };
}

let shared: Shared | null | undefined;

function setup(): Shared | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
  });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u: Shared["u"] = {};
  for (const n of ["uSrc", "uMap", "uOut", "uSrcSize", "uOrigin", "uPad", "uK", "uScale", "uDisp"])
    u[n] = gl.getUniformLocation(prog, n);
  gl.uniform1i(u.uSrc, 0);
  gl.uniform1i(u.uMap, 1);
  const src = texture(gl);
  if (!src) return null;
  return { gl, canvas, u, src, maps: new WeakMap(), last: { source: null, at: -1 } };
}

function texture(gl: WebGL2RenderingContext): WebGLTexture | null {
  const t = gl.createTexture();
  if (!t) return null;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

function mapTexture(s: Shared, map: LensMap): WebGLTexture | null {
  const hit = s.maps.get(map);
  if (hit) return hit;
  const { gl } = s;
  const t = texture(gl);
  if (!t) return null;
  const px = new Uint8Array(map.width * map.height * 4);
  for (let p = 0, q = 0; p < map.width * map.height; p++, q += 2) {
    px[p * 4] = Math.round((map.offsets[q] / map.scale + 0.5) * 255);
    px[p * 4 + 1] = Math.round((map.offsets[q + 1] / map.scale + 0.5) * 255);
    px[p * 4 + 3] = 255;
  }
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, map.width, map.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
  s.maps.set(map, t);
  return t;
}

/** Whether the GPU lens can run here (WebGL2). */
export function supportsGPULens(): boolean {
  if (shared === undefined) shared = setup();
  return shared !== null;
}

export interface RefractOptions {
  /** Margin around the lens, in output pixels, copied without bending. */
  pad?: number;
  /** Red bends `1 + dispersion` as far as green, blue `1 − dispersion`. */
  dispersion?: number;
}

/**
 * Bends the part of `source` under a viewport rectangle with a lens map and draws it
 * into `target`, which should be `map` sized plus `pad` on every side. `rect` covers the
 * padded area. A WebGL `source` must be read in the same task it was drawn in (e.g. in a
 * backdrop `frame` callback). Returns false when the GPU lens is unavailable.
 */
export function refract(
  target: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  rect: DOMRect,
  map: LensMap,
  options: RefractOptions = {},
): boolean {
  if (!supportsGPULens() || !shared) return false;
  const s = shared;
  const { gl, u } = s;
  const pad = options.pad ?? 0;
  const W = map.width + pad * 2;
  const H = map.height + pad * 2;
  const box = source.getBoundingClientRect();
  if (!box.width || !source.width || !source.height) return false;
  const k = source.width / box.width;

  if (s.canvas.width < W || s.canvas.height < H) {
    s.canvas.width = Math.max(s.canvas.width, W);
    s.canvas.height = Math.max(s.canvas.height, H);
  }
  gl.viewport(0, s.canvas.height - H, W, H);

  // One upload per source per frame, shared by every glass that refracts it.
  const now = performance.now();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, s.src);
  if (s.last.source !== source || now - s.last.at > 4) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    s.last = { source, at: now };
  }
  const mt = mapTexture(s, map);
  if (!mt) return false;
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, mt);

  gl.uniform2f(u.uOut, W, H);
  gl.uniform2f(u.uSrcSize, source.width, source.height);
  gl.uniform2f(u.uOrigin, (rect.left - box.left) * k, (rect.top - box.top) * k);
  gl.uniform2f(u.uPad, pad, pad);
  gl.uniform1f(u.uK, (rect.width / W) * k);
  gl.uniform1f(u.uScale, map.scale);
  gl.uniform1f(u.uDisp, options.dispersion ?? 0.15);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  target.drawImage(s.canvas, 0, 0, W, H, 0, 0, target.canvas.width, target.canvas.height);
  return true;
}
