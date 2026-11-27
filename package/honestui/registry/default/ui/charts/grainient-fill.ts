// A grainient texture for chart fills: the same warped, grainy colour field as
// the Grainient shader, rendered once into a canvas and handed to ECharts as an
// image pattern. It uses raw WebGL2 so the charts entry does not depend on the
// shaders entry, shares one context across every chart on the page, and lets
// that context go when the last chart using it unmounts.

export interface GrainientFillOptions {
  /** Up to three CSS colors. Defaults to a ramp built from the series color. */
  colors?: string[];
  /** Grain strength, 0 to 0.4. Defaults to 0.14. */
  grain?: number;
  /** How strongly the colors warp into each other, 0 to 2. Defaults to 1. */
  warp?: number;
  /** Opacity of the fill at the top of the plot, 0 to 1. Defaults to 0.55. */
  intensity?: number;
  /** Fade the fill toward the baseline. Defaults to true. */
  fade?: boolean;
  /** Picks a different arrangement of the same colors. Defaults to one derived from the series key. */
  seed?: number;
  /** Let the colors drift slowly. Off by default, and always off with reduced motion. */
  animate?: boolean;
  /** Drift speed when `animate` is on. Defaults to 1. */
  speed?: number;
}

export interface GrainientTextureRequest {
  options: GrainientFillOptions;
  /** Resolved series colors, used when `options.colors` is not set. */
  slots: string[];
  /** A stable string per series, used for the default seed. */
  key: string;
  /** The chart's background color; on a dark surface the ramp lifts so it glows instead of muddying. */
  surface?: string;
  width: number;
  height: number;
  /** Seconds of drift; omitted for a still fill. */
  time?: number;
}

export interface GrainientTexture {
  image: HTMLCanvasElement;
  dpr: number;
}

const VERTEX = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uWarp;
uniform float uGrain;
uniform float uDpr;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
  return fract(sin(p) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(dot(-1.0 + 2.0 * hash(i), f), dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y);
  return 0.5 + 0.5 * n;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float ratio = uResolution.x / uResolution.y;
  vec2 p = uv - 0.5;
  p /= 0.9;
  float degree = noise(vec2(uTime * 0.1, p.x * p.y) * 2.0);
  p.y /= ratio;
  p *= rot(radians((degree - 0.5) * 420.0 + 180.0));
  p.y *= ratio;
  float amp = 50.0 / max(uWarp, 0.001);
  p.x += sin(p.y * 4.0 + uTime * 2.0) / amp;
  p.y += sin(p.x * 6.0 + uTime * 2.0) / (amp * 0.5);
  float x = (p * rot(0.0)).x;
  vec3 a = mix(uColor3, uColor2, smoothstep(-0.35, 0.25, x));
  vec3 b = mix(uColor2, uColor1, smoothstep(-0.35, 0.25, x));
  vec3 col = mix(a, b, smoothstep(0.55, -0.35, p.y));
  // Grain sits on device pixels so it stays fine on dense screens.
  vec2 g = floor(gl_FragCoord.xy / max(uDpr * 0.75, 1.0));
  float grain = fract(sin(dot(g, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * uGrain;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

type Renderer = {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

let renderer: Renderer | null = null;
let unavailable = false;
let retainCount = 0;
const cache = new Map<string, GrainientTexture>();
const CACHE_LIMIT = 32;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function getRenderer(): Renderer | null {
  if (renderer && !renderer.gl.isContextLost()) return renderer;
  renderer = null;
  if (unavailable || typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    preserveDrawingBuffer: true,
    premultipliedAlpha: false,
  });
  if (!gl) {
    unavailable = true;
    return null;
  }
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) {
    unavailable = true;
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    unavailable = true;
    return null;
  }
  gl.useProgram(program);

  // One triangle that covers the viewport.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniforms: Renderer["uniforms"] = {};
  for (const name of ["uResolution", "uTime", "uWarp", "uGrain", "uDpr", "uColor1", "uColor2", "uColor3"]) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  renderer = { canvas, gl, program, uniforms };
  return renderer;
}

/**
 * Keep the shared WebGL context while a chart draws grainient fills. Call the
 * returned function on unmount; the context is released with the last one.
 */
export function retainGrainientRenderer(): () => void {
  retainCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    retainCount = Math.max(retainCount - 1, 0);
    if (retainCount > 0) return;
    cache.clear();
    if (renderer) {
      renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
      renderer = null;
    }
  };
}

let probe: CanvasRenderingContext2D | null = null;

/** Any CSS color, including oklch() and color-mix(), as 0–1 RGB. */
export function cssColorToRgb(color: string): [number, number, number] | null {
  if (typeof document === "undefined") return null;
  if (!probe) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!probe) return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  if (a === 0) return null;
  return [r / 255, g / 255, b / 255];
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
  if (s === 0) return [l, l, l];
  const hue = (p: number, q: number, t: number) => {
    const u = ((t % 1) + 1) % 1;
    if (u < 1 / 6) return p + (q - p) * 6 * u;
    if (u < 1 / 2) return q;
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)];
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/**
 * Three colors for the field. Given one series color, the ramp stays in its
 * family: a lighter tint, the color itself, and a neighbour a little round the
 * hue wheel, so a single series reads as its own color.
 */
export function grainientPalette(colors: string[], dark = false): [number, number, number][] {
  const parsed = colors
    .map((c) => cssColorToRgb(c))
    .filter((c): c is [number, number, number] => c !== null);
  if (parsed.length === 0) parsed.push([0.47, 0.47, 0.47]);
  if (parsed.length >= 3) return parsed.slice(0, 3);
  if (parsed.length === 2) {
    const [a, b] = parsed;
    return [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], b];
  }
  const [h, s, l] = rgbToHsl(parsed[0]);
  if (dark) {
    // On a dark surface every stop stays bright; depth comes from hue, not shade.
    return [
      hslToRgb([h - 0.04, clamp01(s * 1.05), clamp01(l + (1 - l) * 0.35)]),
      hslToRgb([h, clamp01(s * 1.1), clamp01(Math.max(l, 0.55))]),
      hslToRgb([h + 0.08, clamp01(s * 1.1), clamp01(Math.max(l * 0.95, 0.45))]),
    ];
  }
  return [
    hslToRgb([h - 0.03, clamp01(s * 0.9), clamp01(l + (1 - l) * 0.45)]),
    parsed[0],
    hslToRgb([h + 0.07, clamp01(s * 1.05), clamp01(l * 0.82)]),
  ];
}

function hashSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 997) / 37;
}

/**
 * Render a grainient texture the size of the chart canvas, faded toward the
 * bottom. Returns null when WebGL2 is unavailable so the caller can fall back.
 * Still textures are cached; drifting ones are drawn fresh each call.
 */
export function renderGrainientTexture(request: GrainientTextureRequest): GrainientTexture | null {
  const { options, slots, key, time } = request;
  const width = Math.ceil(request.width);
  const height = Math.ceil(request.height);
  if (width < 2 || height < 2 || typeof window === "undefined") return null;

  const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
  const surface = request.surface ? cssColorToRgb(request.surface) : null;
  const dark = surface ? 0.2126 * surface[0] + 0.7152 * surface[1] + 0.0722 * surface[2] < 0.35 : false;
  const palette = grainientPalette(options.colors?.length ? options.colors : slots, dark);
  const grain = Math.min(Math.max(options.grain ?? (dark ? 0.12 : 0.14), 0), 0.4);
  const warp = Math.min(Math.max(options.warp ?? 1, 0), 2);
  const intensity = clamp01(options.intensity ?? (dark ? 0.75 : 0.55));
  const fade = options.fade ?? true;
  const seed = options.seed ?? hashSeed(key);
  const t = seed + (time ?? 0) * 0.25 * (options.speed ?? 1);

  const cacheKey =
    time === undefined
      ? [width, height, dpr, palette.flat().map((v) => v.toFixed(3)).join(","), grain, warp, intensity, fade, seed].join("|")
      : null;
  if (cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit) return hit;
  }

  const r = getRenderer();
  if (!r) return null;
  const { gl, canvas, uniforms } = r;
  const pw = Math.round(width * dpr);
  const ph = Math.round(height * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  gl.viewport(0, 0, pw, ph);
  gl.uniform2f(uniforms.uResolution, pw, ph);
  gl.uniform1f(uniforms.uTime, t);
  gl.uniform1f(uniforms.uWarp, warp);
  gl.uniform1f(uniforms.uGrain, grain);
  gl.uniform1f(uniforms.uDpr, dpr);
  gl.uniform3fv(uniforms.uColor1, palette[0]);
  gl.uniform3fv(uniforms.uColor2, palette[1]);
  gl.uniform3fv(uniforms.uColor3, palette[2]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  const out = document.createElement("canvas");
  out.width = pw;
  out.height = ph;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(canvas, 0, 0);

  // Alpha: strongest at the top of the plot, easing out toward the baseline.
  const mask = ctx.createLinearGradient(0, 0, 0, ph);
  mask.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
  mask.addColorStop(0.55, `rgba(0, 0, 0, ${intensity * (fade ? 0.55 : 1)})`);
  mask.addColorStop(1, `rgba(0, 0, 0, ${fade ? intensity * 0.04 : intensity})`);
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, pw, ph);

  const texture = { image: out, dpr };
  if (cacheKey) {
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
    cache.set(cacheKey, texture);
  }
  return texture;
}
