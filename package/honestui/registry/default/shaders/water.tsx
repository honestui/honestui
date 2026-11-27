"use client";

import React, { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export interface WaterProps {
  /** Color of the deeper water, at the bottom of the container. */
  deepColor?: string;
  /** Color of the shallower water, at the top of the container. */
  shallowColor?: string;
  /** Color of the caustic light network. */
  highlightColor?: string;
  /** Brightness of the caustics, from 0 to 2. */
  intensity?: number;
  /** Size of the caustic pattern. Larger values give bigger, fewer cells. */
  scale?: number;
  /** How much the surface bends what lies beneath it, from 0 to 1. */
  distortion?: number;
  /** Color fringing along the brightest caustic lines, from 0 to 1. */
  dispersion?: number;
  /** Optional image seen through the water. It covers the container like object-fit: cover. */
  src?: string;
  /** Leaves ripples where the pointer moves and taps. */
  ripples?: boolean;
  /** Animation speed. 0 holds the current frame. */
  speed?: number;
  /** Renders a static frame instead of animating. */
  paused?: boolean;
  className?: string;
}

const MAX_RIPPLES = 8;
const RIPPLE_LIFETIME = 2.6;
const INITIAL_TIME = 6;

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
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uHighlight;
uniform float uIntensity;
uniform float uScale;
uniform float uDistortion;
uniform float uDispersion;
uniform sampler2D uImage;
uniform float uHasImage;
uniform float uImageAspect;
uniform vec4 uRipples[${MAX_RIPPLES}];

out vec4 fragColor;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// Difference between the nearest and second-nearest wandering site: near 0
// along cell borders, which is where light focuses into bright threads.
float threads(vec2 x, float t) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float first = 8.0;
  float second = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 h = hash2(n + g);
      vec2 r = g + 0.5 + 0.42 * sin(t * (0.5 + 0.4 * h) + 6.2831 * h.yx) - f;
      float d = dot(r, r);
      if (d < first) {
        second = first;
        first = d;
      } else if (d < second) {
        second = d;
      }
    }
  }
  return sqrt(second) - sqrt(first);
}

// Two layers of threads at different sizes and speeds, gently warped; their
// sum is the moving caustic network.
float caustics(vec2 p, float t) {
  vec2 q = p + 0.12 * vec2(sin(p.y * 2.3 + t * 0.6), cos(p.x * 2.1 - t * 0.5));
  float a = threads(q * 1.0 + vec2(t * 0.05, 0.0), t);
  float b = threads(q * 1.7 - vec2(0.0, t * 0.04) + 4.7, t * 1.2);
  float lineA = pow(1.0 - smoothstep(0.0, 0.22, a), 3.0);
  float lineB = pow(1.0 - smoothstep(0.0, 0.18, b), 3.0);
  return lineA * 0.75 + lineB * 0.45 + lineA * lineB * 0.8;
}

// A slow height field for refraction, plus expanding rings from ripples.
float surface(vec2 p, float t) {
  float h = sin(p.x * 3.1 + t * 0.7) * cos(p.y * 2.7 - t * 0.6) * 0.5;
  h += sin((p.x + p.y) * 5.3 - t * 1.1) * 0.25;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 ripple = uRipples[i];
    if (ripple.w <= 0.0) continue;
    float age = ripple.z;
    float d = length(p - ripple.xy);
    float front = age * 0.32;
    float ring = exp(-pow((d - front) * 14.0, 2.0));
    float fade = ripple.w * (1.0 - smoothstep(0.0, ${RIPPLE_LIFETIME.toFixed(1)}, age));
    // Keep the ripple's slope close to the base wave's, so it bends the
    // light visibly without scrambling the caustics.
    h += sin((d - front) * 38.0) * ring * fade * 0.11;
  }
  return h;
}

void main() {
  float minRes = min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / minRes;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime;

  // Surface slope from finite differences bends both the view and the light.
  float e = 0.004;
  float h = surface(p, t);
  vec2 slope = vec2(surface(p + vec2(e, 0.0), t) - h, surface(p + vec2(0.0, e), t) - h) / e;
  vec2 bend = slope * 0.012 * uDistortion;

  vec3 base;
  if (uHasImage > 0.5) {
    float viewAspect = uResolution.x / uResolution.y;
    vec2 cover = viewAspect > uImageAspect
      ? vec2(1.0, uImageAspect / viewAspect)
      : vec2(viewAspect / uImageAspect, 1.0);
    vec2 imageUv = (uv - 0.5) * cover + 0.5 + bend;
    base = texture(uImage, clamp(imageUv, 0.001, 0.999)).rgb;
  } else {
    base = mix(uDeep, uShallow, smoothstep(-0.1, 1.05, uv.y + bend.y * 2.0));
  }

  vec2 cp = (p + bend * 3.0) * (4.0 / max(uScale, 0.1));
  float spread = uDispersion * 0.035;
  vec3 light = vec3(
    caustics(cp + vec2(spread, 0.0), t),
    caustics(cp, t),
    caustics(cp - vec2(spread, 0.0), t)
  );

  // Caustics are light, so they add; slopes facing up catch a little sheen.
  // Over a photo the light is toned down so the image stays readable.
  float strength = uIntensity * mix(0.55, 0.32, uHasImage);
  vec3 color = base + uHighlight * light * strength;
  color += uHighlight * smoothstep(0.6, 2.4, length(slope)) * 0.08 * uDistortion;

  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

type Uniforms = {
  uResolution: { value: Float32Array };
  uTime: { value: number };
  uDeep: { value: Float32Array };
  uShallow: { value: Float32Array };
  uHighlight: { value: Float32Array };
  uIntensity: { value: number };
  uScale: { value: number };
  uDistortion: { value: number };
  uDispersion: { value: number };
  uImage: { value: Texture };
  uHasImage: { value: number };
  uImageAspect: { value: number };
  // A plain array: ogl only uploads uniform arrays (uRipples[8]) from Array values.
  uRipples: { value: number[] };
};

type ShaderContext = {
  uniforms: Uniforms;
  gl: Renderer["gl"];
  draw: () => void;
  setRunning: (running: boolean) => void;
};

type Ripple = { x: number; y: number; start: number; strength: number };

const Water: React.FC<WaterProps> = ({
  deepColor = "#0b3a4f",
  shallowColor = "#1d7a8c",
  highlightColor = "#e6fbff",
  intensity = 1,
  scale = 1,
  distortion = 0.6,
  dispersion = 0.3,
  src,
  ripples = true,
  speed = 1,
  paused = false,
  className = "",
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isPaused = paused || shouldReduceMotion;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<ShaderContext | null>(null);
  const speedRef = useRef(speed);
  const ripplesRef = useRef(ripples);

  // Effect 1: build the WebGL context once and own the render loop.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
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
      uDeep: { value: new Float32Array([0, 0, 0]) },
      uShallow: { value: new Float32Array([0, 0, 0]) },
      uHighlight: { value: new Float32Array([1, 1, 1]) },
      uIntensity: { value: 1 },
      uScale: { value: 1 },
      uDistortion: { value: 0.6 },
      uDispersion: { value: 0.3 },
      uImage: { value: new Texture(gl, { generateMipmaps: false }) },
      uHasImage: { value: 0 },
      uImageAspect: { value: 1 },
      uRipples: { value: new Array<number>(MAX_RIPPLES * 4).fill(0) },
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

    // Ripples live on a wall clock, so they spread at the same pace whatever
    // the speed prop is, and only while animating.
    let raf = 0;
    let clock = 0;
    const live: Ripple[] = [];
    let lastRipple = { x: 0, y: 0, at: -1 };

    const addRipple = (event: PointerEvent, strength: number) => {
      if (!ripplesRef.current || raf === 0) return;
      const rect = container.getBoundingClientRect();
      const unit = Math.max(1, Math.min(rect.width, rect.height));
      const x = (event.clientX - rect.left - rect.width / 2) / unit;
      const y = -(event.clientY - rect.top - rect.height / 2) / unit;
      const moved = Math.hypot(x - lastRipple.x, y - lastRipple.y);
      // Moving the pointer drops a ripple every so often, not on every event.
      if (strength < 1 && (clock - lastRipple.at < 0.09 || moved < 0.05)) return;
      lastRipple = { x, y, at: clock };
      live.push({ x, y, start: clock, strength });
      if (live.length > MAX_RIPPLES) live.shift();
    };
    const onPointerMove = (event: PointerEvent) => addRipple(event, 0.5);
    const onPointerDown = (event: PointerEvent) => addRipple(event, 1);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onPointerDown);

    const writeRipples = () => {
      const values = uniforms.uRipples.value;
      values.fill(0);
      for (let i = live.length - 1; i >= 0; i--) {
        if (clock - live[i].start > RIPPLE_LIFETIME) live.splice(i, 1);
      }
      live.forEach((ripple, index) => {
        values.splice(index * 4, 4, ripple.x, ripple.y, clock - ripple.start, ripple.strength);
      });
    };

    // Time advances by frame delta times speed, so changing speed never jumps.
    let last = 0;
    let wantsToRun = false;
    let isVisible = true;
    let isPageVisible = !document.hidden;

    const loop = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      clock += delta;
      uniforms.uTime.value += delta * speedRef.current;
      writeRipples();
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
      gl,
      draw,
      setRunning: (running) => {
        wantsToRun = running;
        if (!running) {
          // A still frame has no half-finished ripples.
          live.length = 0;
          uniforms.uRipples.value.fill(0);
        }
        sync();
        if (!running) draw();
      },
    };

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      contextRef.current = null;
      if (canvas.parentElement === container) container.removeChild(canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  // Effect 2: start or stop animating.
  useEffect(() => {
    contextRef.current?.setRunning(!isPaused);
  }, [isPaused]);

  // Effect 3: load the optional image. Until it arrives, and if it fails,
  // the color gradient shows instead.
  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    const { uniforms, gl, draw } = context;
    if (!src) {
      uniforms.uHasImage.value = 0;
      draw();
      return;
    }
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      uniforms.uImage.value = new Texture(gl, { image, generateMipmaps: false });
      uniforms.uImageAspect.value = image.naturalWidth / Math.max(1, image.naturalHeight);
      uniforms.uHasImage.value = 1;
      draw();
    };
    image.onerror = () => {
      if (cancelled) return;
      uniforms.uHasImage.value = 0;
      draw();
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Effect 4: sync props to uniforms and draw, so a paused frame updates too.
  useEffect(() => {
    speedRef.current = speed;
    ripplesRef.current = ripples;
    const context = contextRef.current;
    if (!context) return;
    const { uniforms } = context;
    uniforms.uDeep.value.set(hexToRgb(deepColor));
    uniforms.uShallow.value.set(hexToRgb(shallowColor));
    uniforms.uHighlight.value.set(hexToRgb(highlightColor));
    uniforms.uIntensity.value = Math.max(intensity, 0);
    uniforms.uScale.value = Math.max(scale, 0.1);
    uniforms.uDistortion.value = Math.max(distortion, 0);
    uniforms.uDispersion.value = Math.min(Math.max(dispersion, 0), 1);
    context.draw();
  }, [deepColor, shallowColor, highlightColor, intensity, scale, distortion, dispersion, ripples, speed]);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className={`relative size-full overflow-hidden ${className}`.trim()}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
};

export default Water;
