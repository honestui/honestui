"use client";

import React, { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export interface VoronoiProps {
  /** Cell colors, up to 8. Each cell picks one at random. */
  colors?: string[];
  /** Color of the edges between cells. */
  edgeColor?: string;
  /** Edge width in CSS pixels. 0 hides the edges. */
  edgeWidth?: number;
  /** Glow that spreads from the edges into the cells, from 0 to 1. */
  glow?: number;
  /** Darkens cells toward their edges for a slightly raised look, from 0 to 1. */
  shading?: number;
  /** Number of cells across the shorter side of the container. */
  scale?: number;
  /** How far each cell's center wanders: 0 makes a square grid, 1 is fully organic. */
  jitter?: number;
  /** Bends the whole pattern with a slow wave, from 0 to 1. */
  distortion?: number;
  /** Animation speed. 0 holds the current frame. */
  speed?: number;
  /** Changes the cell layout and color picks while keeping the same look. */
  seed?: number;
  /** Renders a static frame instead of animating. */
  paused?: boolean;
  className?: string;
}

const MAX_COLORS = 8;
const INITIAL_TIME = 4;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.trim().replace(/^#/, "");
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return [1, 1, 1];
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
}

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform vec3 uEdgeColor;
uniform float uEdgeWidth;
uniform float uGlow;
uniform float uShading;
uniform float uScale;
uniform float uJitter;
uniform float uDistortion;
uniform float uSeed;
uniform float uPixelRatio;

out vec4 fragColor;

vec2 hash2(vec2 p) {
  p += uSeed * vec2(37.17, 11.93);
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// Each cell's site circles slowly around the cell's middle; jitter sets
// how far from the middle it may go.
vec2 site(vec2 cell) {
  vec2 h = hash2(cell);
  return 0.5 + 0.5 * uJitter * sin(uTime * (0.6 + 0.5 * h.yx) + 6.2831 * h);
}

// Returns the distance to the nearest cell border, the nearest cell's id,
// and the distance to its site. The second pass measures to the bisector
// between neighbouring sites, so edges keep an even width.
float cells(vec2 x, out vec2 id, out float toSite) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  vec2 nearestCell = vec2(0.0);
  vec2 nearest = vec2(0.0);
  float best = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + site(n + g) - f;
      float d = dot(r, r);
      if (d < best) {
        best = d;
        nearest = r;
        nearestCell = g;
      }
    }
  }

  float border = 8.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 g = nearestCell + vec2(float(i), float(j));
      vec2 r = g + site(n + g) - f;
      vec2 between = r - nearest;
      if (dot(between, between) > 1e-5) {
        border = min(border, dot(0.5 * (nearest + r), normalize(between)));
      }
    }
  }

  id = n + nearestCell;
  toSite = length(nearest);
  return border;
}

void main() {
  float minRes = min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / minRes;

  // A slow, large wave bends the whole field.
  float t = uTime;
  p += uDistortion * 0.06 * vec2(sin(p.y * 4.0 + t * 0.7), cos(p.x * 3.5 - t * 0.6));

  vec2 x = p * uScale;
  vec2 id;
  float toSite;
  float border = cells(x, id, toSite);

  int pick = int(floor(hash2(id + 17.0).x * float(uColorCount)));
  vec3 color = uColors[min(pick, uColorCount - 1)];

  // Cells darken slightly toward their borders, like low domes.
  color *= mix(1.0, 0.55 + 0.45 * smoothstep(0.0, 0.32, border), uShading);

  // Edge width is given in CSS pixels; one pixel in cell units is
  // uScale / minRes, times the device pixel ratio.
  float pixel = uScale / minRes;
  float halfWidth = 0.5 * uEdgeWidth * uPixelRatio * pixel;
  float edge = uEdgeWidth > 0.0 ? 1.0 - smoothstep(halfWidth - pixel, halfWidth + pixel, border) : 0.0;

  float glow = uGlow * exp(-max(border - halfWidth, 0.0) / (0.02 + 0.12 * uGlow));
  color = mix(color, uEdgeColor, clamp(glow * 0.75, 0.0, 1.0));
  color = mix(color, uEdgeColor, edge);

  fragColor = vec4(color, 1.0);
}
`;

type Uniforms = {
  uResolution: { value: Float32Array };
  uTime: { value: number };
  // A plain array: ogl only uploads uniform arrays (uColors[8]) from Array values.
  uColors: { value: number[] };
  uColorCount: { value: number };
  uEdgeColor: { value: Float32Array };
  uEdgeWidth: { value: number };
  uGlow: { value: number };
  uShading: { value: number };
  uScale: { value: number };
  uJitter: { value: number };
  uDistortion: { value: number };
  uSeed: { value: number };
  uPixelRatio: { value: number };
};

type ShaderContext = {
  uniforms: Uniforms;
  draw: () => void;
  setRunning: (running: boolean) => void;
};

const DEFAULT_COLORS = ["#16181d", "#1c1f26", "#21252e", "#262a35"];

const Voronoi: React.FC<VoronoiProps> = ({
  colors = DEFAULT_COLORS,
  edgeColor = "#5eead4",
  edgeWidth = 1.5,
  glow = 0.35,
  shading = 0.5,
  scale = 6,
  jitter = 0.85,
  distortion = 0.25,
  speed = 0.5,
  seed = 1,
  paused = false,
  className = "",
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isPaused = paused || shouldReduceMotion;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<ShaderContext | null>(null);
  const speedRef = useRef(speed);

  // Effect 1: build the WebGL context once and own the render loop.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let renderer: Renderer;
    try {
      renderer = new Renderer({ webgl: 2, alpha: true, antialias: false, dpr });
    } catch {
      return; // No WebGL: the container's own background shows instead.
    }
    const gl = renderer.gl;
    if (!gl) return;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const uniforms: Uniforms = {
      uResolution: { value: new Float32Array([1, 1]) },
      uTime: { value: INITIAL_TIME },
      uColors: { value: new Array<number>(MAX_COLORS * 3).fill(0) },
      uColorCount: { value: 1 },
      uEdgeColor: { value: new Float32Array([1, 1, 1]) },
      uEdgeWidth: { value: 1.5 },
      uGlow: { value: 0.35 },
      uShading: { value: 0.5 },
      uScale: { value: 6 },
      uJitter: { value: 0.85 },
      uDistortion: { value: 0.25 },
      uSeed: { value: 1 },
      uPixelRatio: { value: dpr },
    };
    const program = new Program(gl, { vertex, fragment, uniforms });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const draw = () => renderer.render({ scene: mesh });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      uniforms.uResolution.value[0] = gl.drawingBufferWidth;
      uniforms.uResolution.value[1] = gl.drawingBufferHeight;
      draw();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // Time advances by frame delta times speed, so changing speed never jumps.
    let raf = 0;
    let last = 0;
    let wantsToRun = false;
    let isVisible = true;
    let isPageVisible = !document.hidden;

    const loop = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      uniforms.uTime.value += delta * speedRef.current;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const sync = () => {
      const shouldRun = wantsToRun && isVisible && isPageVisible;
      if (shouldRun && raf === 0) {
        last = 0;
        raf = requestAnimationFrame(loop);
      } else if (!shouldRun && raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      sync();
    });
    intersectionObserver.observe(container);
    const onVisibilityChange = () => {
      isPageVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    contextRef.current = {
      uniforms,
      draw,
      setRunning: (running) => {
        wantsToRun = running;
        sync();
        if (!running) draw();
      },
    };

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      contextRef.current = null;
      if (canvas.parentElement === container) container.removeChild(canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  // Effect 2: start or stop animating.
  useEffect(() => {
    contextRef.current?.setRunning(!isPaused);
  }, [isPaused]);

  // Effect 3: sync props to uniforms and draw, so a paused frame updates too.
  const colorKey = colors.join(",");
  useEffect(() => {
    speedRef.current = speed;
    const context = contextRef.current;
    if (!context) return;
    const { uniforms } = context;
    const palette = (colorKey ? colorKey.split(",") : DEFAULT_COLORS).slice(0, MAX_COLORS);
    palette.forEach((color, index) => {
      uniforms.uColors.value.splice(index * 3, 3, ...hexToRgb(color));
    });
    uniforms.uColorCount.value = Math.max(1, palette.length);
    uniforms.uEdgeColor.value.set(hexToRgb(edgeColor));
    uniforms.uEdgeWidth.value = Math.max(edgeWidth, 0);
    uniforms.uGlow.value = Math.min(Math.max(glow, 0), 1);
    uniforms.uShading.value = Math.min(Math.max(shading, 0), 1);
    uniforms.uScale.value = Math.max(scale, 0.5);
    uniforms.uJitter.value = Math.min(Math.max(jitter, 0), 1);
    uniforms.uDistortion.value = Math.max(distortion, 0);
    uniforms.uSeed.value = seed;
    context.draw();
  }, [colorKey, edgeColor, edgeWidth, glow, shading, scale, jitter, distortion, speed, seed]);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className={`relative size-full overflow-hidden ${className}`.trim()}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
};

export default Voronoi;
