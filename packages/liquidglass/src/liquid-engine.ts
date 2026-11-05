import {
  createSource,
  drawRegion,
  measure,
  type BackdropReading,
  type BackdropSource,
} from "./backdrop";

/**
 * The liquid. One height field h(q, t): each pass pushes x by a wave running along y
 * and y by a wave running along x. Stacked, the waves fold into smooth marbled
 * currents. A soft vortex trails the pointer. The surface is lit like a wet, glossy
 * liquid — diffuse light, a sharp highlight, and a bright sky mirrored on the slopes
 * that tilt away.
 */

export interface LiquidColors {
  /** The troughs. */
  deep: string;
  mid: string;
  /** The crests. */
  pale: string;
  /** Warmth toward the top of the surface. */
  warm: string;
  /** The sky the slopes mirror. */
  env: string;
  /** The highlight. */
  spec: string;
}

export const LIQUID_COLORS: { light: LiquidColors; dark: LiquidColors } = {
  light: {
    deep: "#0b2c9e",
    mid: "#3a7cf0",
    pale: "#dde9ff",
    warm: "#f7ead6",
    env: "#f2f6ff",
    spec: "#ffffff",
  },
  dark: {
    deep: "#02031a",
    mid: "#1a2296",
    pale: "#5466de",
    warm: "#2d1a74",
    env: "#7d8cf2",
    spec: "#cdd5ff",
  },
};

export interface LiquidSettings {
  theme: "light" | "dark";
  colors?: { light?: Partial<LiquidColors>; dark?: Partial<LiquidColors> };
  /** Flow speed multiplier. */
  speed: number;
  /** How many currents fit on screen. Higher is busier. */
  scale: number;
  /** How wet and three-dimensional the surface looks. */
  bump: number;
  /** How strongly the pointer stirs the liquid. 0 turns stirring off. */
  stir: number;
  /** Freeze the flow (the pointer still stirs). Reduced motion freezes it too. */
  paused: boolean;
  /** Render resolution as a fraction of device pixels. */
  resolution: number;
}

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes, uMouse;
uniform float uTime, uTheme, uStir, uScale, uBump;
uniform vec3 uDeep, uMid, uPale, uWarm, uEnv, uSpec;
out vec4 outColor;

float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

float field(vec2 q, float t) {
  vec2 d = q - uMouse;
  float a = uStir * exp(-dot(d, d) * 7.);
  float c = cos(a), s = sin(a);
  vec2 p = (uMouse + mat2(c, s, -s, c) * d) * uScale;
  for (int i = 1; i <= 6; i++) {
    float fi = float(i);
    p.x += .62 / fi * sin(fi * p.y + t + .3 * fi) + .5;
    p.y += .62 / fi * cos(fi * p.x + t * .8 + .5 * fi) - .5;
  }
  return .5 + .5 * sin(1.5 * (p.x + .7 * p.y));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes; uv.y = 1. - uv.y;
  vec2 q = vec2(uv.x * uRes.x / uRes.y, uv.y);
  float t = uTime * .28;

  float h = field(q, t), e = .002;
  vec2 g = vec2(field(q + vec2(e, 0.), t) - h, field(q + vec2(0., e), t) - h) / e;
  vec3 n = normalize(vec3(-g * uBump, 1.));

  vec3 L = normalize(vec3(-.5, -.65, .6));
  float diff = clamp(dot(n, L), 0., 1.);
  float nh = clamp(dot(n, normalize(L + vec3(0., 0., 1.))), 0., 1.);
  float fres = smoothstep(0., .35, 1. - n.z);

  vec3 col = mix(uDeep, uMid, smoothstep(0., .45, h));
  col = mix(col, uPale, smoothstep(.45, .95, h));
  col = mix(col, uWarm, smoothstep(.45, 0., uv.y) * smoothstep(.4, 1., h) * .45);
  col *= .62 + .5 * diff;
  col = mix(col, uEnv, fres * .6);
  col += uSpec * (pow(nh, 90.) * 1.1 + pow(nh, 14.) * .14) * (1. - .35 * uTheme);
  col += (vec3(.55, .2, .5) * max(n.x, 0.) + vec3(.1, .45, .6) * max(-n.x, 0.)) * fres * .35;
  col *= 1. - smoothstep(.55, 1.2, uv.y) * mix(.12, .25, uTheme);

  col += (hash(gl_FragCoord.xy) - .5) / 255.;
  outColor = vec4(col, 1.);
}`;

const VERT = "#version 300 es\nin vec2 p;\nvoid main() { gl_Position = vec4(p, 0., 1.); }";
const KEYS = ["deep", "mid", "pale", "warm", "env", "spec"] as const;
const SWIRL = 2.4;

type RGB = [number, number, number];

/** Draws the liquid into a canvas and answers "what is under this rectangle?". */
export class LiquidEngine {
  readonly source: BackdropSource;
  private notify: () => void;
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private settings: LiquidSettings;
  private palette = { light: resolve("light"), dark: resolve("dark") };
  private time = 12;
  private mix: number;
  private stirNow = 0;
  private mouse: [number, number] = [0.5, 0.5];
  private mouseTarget: [number, number] = [0.5, 0.5];
  private lastMove = -1e9;
  private raf = 0;
  private frameListeners = new Set<() => void>();
  /** True while frame listeners run: the WebGL buffer still holds this frame. */
  private drawn = false;
  private last = 0;
  private lastNotify = 0;
  private reduced: MediaQueryList | null =
    typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  private still: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement, settings: LiquidSettings) {
    this.canvas = canvas;
    this.settings = settings;
    this.mix = settings.theme === "dark" ? 1 : 0;
    const src = createSource((rect) => this.sample(rect), {
      capture: (rect, target) => this.capture(rect, target),
      frame: (listener) => {
        this.frameListeners.add(listener);
        return () => this.frameListeners.delete(listener);
      },
    });
    this.source = src;
    this.notify = src.notify;
    this.gl = canRunShader() ? this.setupGL() : null;
    this.update(settings);
  }

  /** True when the liquid moves; false when it fell back to a still CPU render. */
  get live(): boolean {
    return this.gl !== null;
  }

  update(settings: LiquidSettings): void {
    const themeChanged = settings.theme !== this.settings.theme;
    const resized = settings.resolution !== this.settings.resolution;
    this.settings = settings;
    if (resized) this.resize();
    this.palette = {
      light: resolve("light", settings.colors),
      dark: resolve("dark", settings.colors),
    };
    if (!this.gl && (themeChanged || !this.still)) this.paintStill();
  }

  start(): void {
    this.resize();
    if (!this.gl) return;
    this.last = performance.now();
    const tick = (now: number) => {
      this.step(Math.min(0.05, (now - this.last) / 1000), now);
      this.last = now;
      this.draw();
      this.drawn = true;
      for (const l of this.frameListeners) l();
      this.drawn = false;
      if (now - this.lastNotify > 180) {
        this.lastNotify = now;
        this.notify();
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  resize(): void {
    const box = this.canvas.getBoundingClientRect();
    const k = Math.min(2, devicePixelRatio || 1) * this.settings.resolution;
    const w = Math.max(1, Math.round(box.width * (this.gl ? k : 0.34)));
    const h = Math.max(1, Math.round(box.height * (this.gl ? k : 0.34)));
    if (w === this.canvas.width && h === this.canvas.height) return;
    this.canvas.width = w;
    this.canvas.height = h;
    if (this.gl) {
      this.gl.viewport(0, 0, w, h);
      this.draw();
    } else this.paintStill();
    this.notify();
  }

  /** Point the vortex at a viewport position. */
  pointer(clientX: number, clientY: number): void {
    const box = this.canvas.getBoundingClientRect();
    if (!box.height) return;
    this.mouseTarget = [(clientX - box.left) / box.height, (clientY - box.top) / box.height];
    if (this.stirNow < 0.02) this.mouse = [...this.mouseTarget];
    this.lastMove = performance.now();
  }

  /** Renders the current frame. The canvas is only readable in the same task. */
  draw(): void {
    const gl = this.gl;
    if (!gl) return;
    const u = this.uniforms;
    const p = this.palette;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.uMouse, this.mouse[0], this.mouse[1]);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uTheme, this.mix);
    gl.uniform1f(u.uStir, this.stirNow * SWIRL * this.settings.stir);
    gl.uniform1f(u.uScale, this.settings.scale);
    gl.uniform1f(u.uBump, this.settings.bump);
    for (const key of KEYS) {
      const c = lerp3(p.light[key], p.dark[key], this.mix);
      gl.uniform3f(u["u" + key[0].toUpperCase() + key.slice(1)], c[0], c[1], c[2]);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Copies the liquid under a viewport rectangle into a 2D canvas. */
  capture(rect: DOMRect, target: CanvasRenderingContext2D): boolean {
    if (this.gl && !this.drawn) this.draw();
    return drawRegion(this.canvas, rect, target);
  }

  sample(rect: DOMRect): BackdropReading | null {
    const box = this.canvas.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const k = W / box.width;
    const x0 = clampInt(Math.floor((rect.left - box.left) * k), 0, W - 1);
    const y0 = clampInt(Math.floor((rect.top - box.top) * k), 0, H - 1);
    const x1 = clampInt(Math.ceil((rect.right - box.left) * k), x0 + 1, W);
    const y1 = clampInt(Math.ceil((rect.bottom - box.top) * k), y0 + 1, H);
    const w = x1 - x0;
    const h = y1 - y0;
    if (this.gl) {
      this.draw();
      const data = new Uint8Array(w * h * 4);
      this.gl.readPixels(x0, H - y1, w, h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
      return measure(data, w, h);
    }
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    return ctx ? measure(ctx.getImageData(x0, y0, w, h).data, w, h) : null;
  }

  /** Stops drawing. The context is kept: a remount (e.g. Strict Mode) reuses the canvas. */
  destroy(): void {
    this.stop();
  }

  private step(dt: number, now: number): void {
    const s = this.settings;
    if (!s.paused && !this.reduced?.matches) this.time += dt * s.speed;
    this.mix += ((s.theme === "dark" ? 1 : 0) - this.mix) * (1 - Math.exp(-dt * 4));
    const k = 1 - Math.exp(-dt * 3);
    this.mouse[0] += (this.mouseTarget[0] - this.mouse[0]) * k;
    this.mouse[1] += (this.mouseTarget[1] - this.mouse[1]) * k;
    const want = now - this.lastMove < 900 ? 1 : 0;
    this.stirNow += (want - this.stirNow) * (1 - Math.exp(-dt * (want ? 2.5 : 0.8)));
  }

  private setupGL(): WebGL2RenderingContext | null {
    const gl = this.canvas.getContext("webgl2", { antialias: false, depth: false, stencil: false });
    if (!gl) return null;
    const prog = link(gl);
    if (!prog) return null;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ["uRes", "uMouse", "uTime", "uTheme", "uStir", "uScale", "uBump"])
      this.uniforms[n] = gl.getUniformLocation(prog, n);
    for (const key of KEYS) {
      const n = "u" + key[0].toUpperCase() + key.slice(1);
      this.uniforms[n] = gl.getUniformLocation(prog, n);
    }
    return gl;
  }

  /** Without WebGL2: the same liquid, one still frame, rendered small on the CPU. */
  private paintStill(): void {
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const { width: W, height: H } = this.canvas;
    const img = ctx.createImageData(W, H);
    const th = this.settings.theme === "dark" ? 1 : 0;
    const p = this.palette;
    const col = Object.fromEntries(
      KEYS.map((k) => [k, lerp3(p.light[k], p.dark[k], th)]),
    ) as Record<(typeof KEYS)[number], RGB>;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = shadeCPU(x / H, y / H, this.time * 0.28, th, col, this.settings);
        const i = (y * W + x) * 4;
        img.data[i] = c[0];
        img.data[i + 1] = c[1];
        img.data[i + 2] = c[2];
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    this.still = img;
    this.notify();
  }
}

function canRunShader(): boolean {
  if (typeof document === "undefined") return false;
  const gl = document.createElement("canvas").getContext("webgl2");
  const ok = gl ? link(gl) !== null : false;
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return ok;
}

function link(gl: WebGL2RenderingContext): WebGLProgram | null {
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
  return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : null;
}

function resolve(
  theme: "light" | "dark",
  colors?: LiquidSettings["colors"],
): Record<(typeof KEYS)[number], RGB> {
  const merged = { ...LIQUID_COLORS[theme], ...colors?.[theme] };
  return Object.fromEntries(KEYS.map((k) => [k, hex(merged[k])])) as Record<
    (typeof KEYS)[number],
    RGB
  >;
}

function hex(h: string): RGB {
  const s = h.replace("#", "");
  const f = s.length === 3 ? [...s].map((c) => c + c).join("") : s;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255) as RGB;
}

function lerp3(a: RGB, b: RGB, k: number): RGB {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function clampInt(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function smooth(a: number, b: number, x: number): number {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

/** The fragment shader, line for line, for one pixel. */
function shadeCPU(
  qx: number,
  qy: number,
  t: number,
  th: number,
  c: Record<(typeof KEYS)[number], RGB>,
  s: LiquidSettings,
): RGB {
  const field = (x: number, y: number) => {
    let px = x * s.scale;
    let py = y * s.scale;
    for (let i = 1; i <= 6; i++) {
      px += (0.62 / i) * Math.sin(i * py + t + 0.3 * i) + 0.5;
      py += (0.62 / i) * Math.cos(i * px + t * 0.8 + 0.5 * i) - 0.5;
    }
    return 0.5 + 0.5 * Math.sin(1.5 * (px + 0.7 * py));
  };
  const e = 0.002;
  const h = field(qx, qy);
  let nx = (-(field(qx + e, qy) - h) / e) * s.bump;
  let ny = (-(field(qx, qy + e) - h) / e) * s.bump;
  let nz = 1;
  const nl = Math.hypot(nx, ny, nz);
  nx /= nl;
  ny /= nl;
  nz /= nl;
  const ll = Math.hypot(-0.5, -0.65, 0.6);
  const L = [-0.5 / ll, -0.65 / ll, 0.6 / ll];
  const diff = Math.max(0, Math.min(1, nx * L[0] + ny * L[1] + nz * L[2]));
  const hl = Math.hypot(L[0], L[1], L[2] + 1);
  const nh = Math.max(0, Math.min(1, (nx * L[0] + ny * L[1] + nz * (L[2] + 1)) / hl));
  const fres = smooth(0, 0.35, 1 - nz);
  let col = lerp3(c.deep, c.mid, smooth(0, 0.45, h));
  col = lerp3(col, c.pale, smooth(0.45, 0.95, h));
  col = lerp3(col, c.warm, smooth(0.45, 0, qy) * smooth(0.4, 1, h) * 0.45);
  const sp = (Math.pow(nh, 90) * 1.1 + Math.pow(nh, 14) * 0.14) * (1 - 0.35 * th);
  const film = [
    [0.55, 0.1],
    [0.2, 0.45],
    [0.5, 0.6],
  ];
  const vig = 1 - smooth(0.55, 1.2, qy) * (0.12 + 0.13 * th);
  return [0, 1, 2].map((i) => {
    let v = col[i] * (0.62 + 0.5 * diff);
    v += (c.env[i] - v) * fres * 0.6;
    v += c.spec[i] * sp;
    v += (film[i][0] * Math.max(nx, 0) + film[i][1] * Math.max(-nx, 0)) * fres * 0.35;
    return Math.max(0, Math.min(1, v * vig)) * 255;
  }) as RGB;
}
