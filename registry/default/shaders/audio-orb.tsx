"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";
import { FULLSCREEN_VERTEX, GLSL_NOISE, prepareColorList } from "./use-fullscreen-shader";

export type AudioOrbState = "idle" | "listening" | "thinking" | "speaking";

/** A level from 0 to 1, or a function the orb calls once per frame for one. */
export type AudioOrbLevel = number | (() => number);

export type AudioOrbLabels = Record<AudioOrbState, string>;

export const defaultAudioOrbLabels: AudioOrbLabels = {
  idle: "Voice assistant ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

export interface AudioOrbProps {
  /** What the voice agent is doing. The orb only shows it. */
  state?: AudioOrbState;
  /** The person's loudness, from 0 to 1. Moves the surface while `listening`. */
  inputLevel?: AudioOrbLevel;
  /** The agent's loudness, from 0 to 1. Pulses the orb while `speaking`. */
  outputLevel?: AudioOrbLevel;
  /**
   * A stream to analyse, such as a microphone or the agent's audio. The orb
   * opens its own analyser and closes it when the stream changes or the orb
   * unmounts. Used for any level you do not pass yourself.
   */
  stream?: MediaStream | null;
  /** An analyser you already own. It takes precedence over `stream` and is never closed here. */
  analyser?: AnalyserNode | null;
  /** Three hex colors: the highlight, the body, and the deep shade. */
  colors?: string[];
  /** Diameter in CSS pixels. Leave unset to fill the container. */
  size?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /** Strength of the film grain on the surface, from 0 to 1. */
  grain?: number;
  /** Renders a still frame instead of animating. */
  paused?: boolean;
  /** Set false to keep the state out of the accessibility tree, when your own text already says it. */
  announce?: boolean;
  labels?: Partial<AudioOrbLabels>;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_COLORS = ["#f3f1ff", "#8a94ff", "#272a63"];

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uColors[3];
uniform float uEnergy;
uniform float uLow;
uniform float uMid;
uniform float uHigh;
uniform float uThink;
uniform float uSpeak;
uniform float uBreath;
uniform float uSpin;
uniform float uGrain;
out vec4 fragColor;
${GLSL_NOISE}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * gnoise(p);
    p = rot2(0.6) * p * 2.03 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return sum;
}

void main() {
  float minSide = min(iResolution.x, iResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * iResolution.xy) / minSide;
  float t = iTime;
  float r = length(p);
  vec2 dir = p / max(r, 1e-4);

  vec3 light = toLinear(uColors[0]);
  vec3 body = toLinear(uColors[1]);
  vec3 deep = toLinear(uColors[2]);

  // The silhouette: low frequencies swell the orb in broad lobes, mids add
  // folds, highs add a fine ripple. Noise on the direction has no seam.
  float n1 = gnoise(dir * 1.5 + vec2(t * 0.31, -t * 0.23));
  float n2 = gnoise(dir * 3.2 + vec2(-t * 0.55, t * 0.47) + 7.1);
  float n3 = gnoise(dir * 6.5 + vec2(t * 1.3, t * 1.05) + 13.7);
  float disp = n1 * (0.02 + 0.085 * uLow) + n2 * (0.008 + 0.055 * uMid) + n3 * (0.002 + 0.028 * uHigh);
  float radius = 0.3 * (1.0 + uBreath + 0.09 * uEnergy + 0.05 * uSpeak * uEnergy) * (1.0 + disp);
  float d = r - radius;
  float aa = 1.25 / minSide;
  float coverage = 1.0 - smoothstep(-aa, aa, d);

  // Shade the disc as a sphere.
  float rr = clamp(r / radius, 0.0, 1.0);
  float z = sqrt(max(1.0 - rr * rr, 0.0));
  vec3 normal = normalize(vec3(p / radius, z + 1e-3));

  // Slow flow inside the glass; it curls harder and turns while thinking.
  vec2 sp = rot2(uSpin) * (normal.xy / (1.0 + z * 0.6));
  vec2 warp = vec2(fbm(sp * 1.2 + vec2(0.0, t * 0.1)), fbm(sp * 1.2 + vec2(4.3, -t * 0.08)));
  float flow = fbm(sp * 1.4 + warp * (1.0 + 1.6 * uThink) + vec2(t * 0.04, uSpin * 0.25));
  float f = smoothstep(0.0, 1.0, clamp(flow * 1.1 + 0.5, 0.0, 1.0));

  vec3 lightDir = normalize(vec3(-0.45, 0.6, 0.66));
  float diffuse = max(dot(normal, lightDir), 0.0);
  float specular = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0), 10.0);
  float fresnel = pow(1.0 - z, 2.4);

  // Light falls across the sphere; the flow only tilts the gradient, so the
  // glass reads as one material instead of clouds on a planet.
  float shade = diffuse * 0.95 + 0.04 + (f - 0.5) * 0.5;
  vec3 color = mix(deep, body, smoothstep(-0.05, 0.8, shade));
  color = mix(color, light, smoothstep(0.6, 1.05, shade) * 0.5);
  // Light passing through the glass lifts the shadowed side a little.
  color = mix(color, body, (1.0 - diffuse) * 0.12 * (0.5 + f));
  // A soft core that brightens with the agent's voice.
  float core = exp(-rr * rr * 2.4);
  color += light * core * (0.08 + 0.32 * uSpeak * uEnergy);
  // The rim catches light; while thinking a glint travels around it.
  float angle = atan(p.y, p.x);
  float glint = pow(0.5 + 0.5 * cos(angle - uSpin * 2.6), 10.0) * uThink;
  color = mix(color, light, clamp(fresnel * (0.35 + 0.35 * uEnergy) + glint * fresnel * 1.4, 0.0, 1.0));
  color += light * specular * 0.22;
  // Film grain keeps the gradients from banding.
  color += (hash12(gl_FragCoord.xy + fract(t * 7.0) * 113.0) - 0.5) * 0.06 * uGrain;

  // A halo that widens with the voice.
  // It fades out before the canvas edge, so no square shows on any surface.
  float edgeFade = 1.0 - smoothstep(0.36, 0.5, r);
  float halo = exp(-max(d, 0.0) * (16.0 - 5.0 * uEnergy)) * (0.14 + 0.3 * uEnergy + 0.08 * uThink) * (1.0 - coverage) * edgeFade;
  vec3 haloColor = mix(body, light, 0.35);

  float alpha = clamp(coverage + halo, 0.0, 1.0);
  vec3 mixed = color * coverage + haloColor * halo;
  vec3 straight = alpha > 0.0 ? mixed / alpha : vec3(0.0);
  fragColor = vec4(clamp(toGamma(straight), 0.0, 1.0), alpha);
}
`;

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0);
const readLevel = (level: AudioOrbLevel | undefined) => clamp01(typeof level === "function" ? level() : (level ?? 0));

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

/** A stream gets its own context and analyser, closed when the stream changes or the orb unmounts. */
function useStreamAnalyser(stream: MediaStream | null | undefined, skip: boolean) {
  const ref = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (skip || !stream || stream.getAudioTracks().length === 0) return;
    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const source = context.createMediaStreamSource(stream);
    const node = context.createAnalyser();
    node.fftSize = 512;
    node.smoothingTimeConstant = 0.6;
    source.connect(node);
    ref.current = node;
    return () => {
      source.disconnect();
      ref.current = null;
      void context.close();
    };
  }, [stream, skip]);

  return ref;
}

type Bands = { level: number; low: number; mid: number; high: number };

/** Loudness and three frequency bands from an analyser, each 0 to 1. */
function readAnalyser(node: AnalyserNode, time: Uint8Array<ArrayBuffer>, freq: Uint8Array<ArrayBuffer>): Bands {
  node.getByteTimeDomainData(time);
  let sum = 0;
  for (let i = 0; i < time.length; i += 1) {
    const centered = (time[i] - 128) / 128;
    sum += centered * centered;
  }
  // Same curve as the voice components, so a level reads the same everywhere.
  const level = Math.min(1, Math.pow(Math.sqrt(sum / time.length) * 3.2, 0.7));
  node.getByteFrequencyData(freq);
  const nyquist = node.context.sampleRate / 2;
  const band = (from: number, to: number) => {
    const start = Math.max(0, Math.floor((from / nyquist) * freq.length));
    const end = Math.min(freq.length, Math.max(start + 1, Math.ceil((to / nyquist) * freq.length)));
    let total = 0;
    for (let i = start; i < end; i += 1) total += freq[i];
    return clamp01((total / (end - start) / 255) * 1.6);
  };
  return { level, low: band(60, 300), mid: band(300, 2000), high: band(2000, 6000) };
}

/**
 * An orb for voice agents drawn with WebGL. It breathes at rest, its surface
 * moves with the person's voice while listening, its inner flow turns while
 * thinking, and it pulses with the agent's voice while speaking.
 */
const AudioOrb: React.FC<AudioOrbProps> = ({
  state = "idle",
  inputLevel,
  outputLevel,
  stream,
  analyser,
  colors = DEFAULT_COLORS,
  size,
  speed = 1,
  grain = 0.5,
  paused = false,
  announce = true,
  labels: labelsProp,
  className = "",
  style,
}) => {
  const labels = { ...defaultAudioOrbLabels, ...labelsProp };
  const shouldReduceMotion = usePrefersReducedMotion();
  const still = paused || shouldReduceMotion;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const streamAnalyser = useStreamAnalyser(stream, analyser != null);
  const colorsKey = colors.join(",");
  const colorList = useMemo(
    () => prepareColorList(colorsKey ? colorsKey.split(",") : [], 3, DEFAULT_COLORS).list,
    [colorsKey],
  );

  // The latest props, read inside the frame loop without restarting it.
  const live = useRef({ state, inputLevel, outputLevel, analyser, speed, grain, colorList, still });
  useLayoutEffect(() => {
    live.current = { state, inputLevel, outputLevel, analyser, speed, grain, colorList, still };
  });
  const controlRef = useRef<{ redraw: () => void; setStill: (still: boolean) => void } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return;
    }
    if (!renderer.isWebgl2) return;

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.dataset.slot = "audio-orb-canvas";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const uniforms: Record<string, { value: unknown }> = {
      iTime: { value: 4 },
      iResolution: { value: [1, 1] },
      uColors: { value: live.current.colorList },
      uEnergy: { value: 0 },
      uLow: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uThink: { value: live.current.state === "thinking" ? 1 : 0 },
      uSpeak: { value: live.current.state === "speaking" ? 1 : 0 },
      uBreath: { value: 0 },
      uSpin: { value: 0 },
      uGrain: { value: live.current.grain },
    };

    let program: Program;
    try {
      program = new Program(gl, {
        vertex: FULLSCREEN_VERTEX,
        fragment,
        uniforms,
        transparent: false,
        depthTest: false,
      });
    } catch {
      container.removeChild(canvas);
      return;
    }
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const timeData = new Uint8Array(512);
    const freqData = new Uint8Array(256);
    // Eased values, so a jump in level or a change of state never snaps.
    const eased = { energy: 0, low: 0, mid: 0, high: 0, think: uniforms.uThink.value as number, speak: uniforms.uSpeak.value as number };
    let time = 4;
    let spin = 0;
    let raf = 0;
    let lastFrame = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;

    const draw = () => {
      const current = live.current;
      uniforms.iTime.value = time;
      uniforms.uColors.value = current.colorList;
      uniforms.uGrain.value = clamp01(current.grain);
      uniforms.uEnergy.value = eased.energy;
      uniforms.uLow.value = eased.low;
      uniforms.uMid.value = eased.mid;
      uniforms.uHigh.value = eased.high;
      uniforms.uThink.value = eased.think;
      uniforms.uSpeak.value = eased.speak;
      uniforms.uSpin.value = spin;
      uniforms.uBreath.value = current.state === "idle" ? Math.sin(time * 1.4) * 0.018 : Math.sin(time * 1.4) * 0.006;
      renderer.render({ scene: mesh });
    };

    /** Moves the eased values toward the current target. With `dt` 0 they jump there. */
    const step = (dt: number) => {
      const current = live.current;
      const node = current.analyser ?? streamAnalyser.current;
      let target: Bands = { level: 0, low: 0, mid: 0, high: 0 };
      const levelProp = current.state === "listening" ? current.inputLevel : current.state === "speaking" ? current.outputLevel : undefined;
      if (current.state === "listening" || current.state === "speaking") {
        if (levelProp == null && node) {
          target = readAnalyser(node, timeData, freqData);
        } else {
          const level = readLevel(levelProp);
          // Without a spectrum, spread one level over the bands so the surface
          // still moves at several scales.
          const wobble = 0.5 + 0.5 * Math.sin(time * 5.3);
          target = { level, low: level, mid: level * (0.55 + 0.35 * wobble), high: level * (0.3 + 0.3 * (1 - wobble)) };
        }
      }
      // A still frame (dt 0) shows a calm version of the level, not one loud instant.
      if (dt === 0) target = { level: target.level * 0.35, low: target.low * 0.35, mid: target.mid * 0.35, high: target.high * 0.35 };
      const ease = (from: number, to: number, attack: number, release: number) =>
        dt === 0 ? to : from + (to - from) * Math.min(1, dt * (to > from ? attack : release));
      eased.energy = ease(eased.energy, target.level, 14, 5);
      eased.low = ease(eased.low, target.low, 10, 4);
      eased.mid = ease(eased.mid, target.mid, 14, 5);
      eased.high = ease(eased.high, target.high, 18, 6);
      eased.think = ease(eased.think, current.state === "thinking" ? 1 : 0, 3, 3);
      eased.speak = ease(eased.speak, current.state === "speaking" ? 1 : 0, 4, 4);
      spin += dt * (0.18 + eased.think * 1.4) * current.speed;
    };

    const frame = (now: number) => {
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
      lastFrame = now;
      time += dt * live.current.speed;
      step(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (live.current.still || !isVisible || !isPageVisible || raf !== 0) return;
      lastFrame = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = 0;
    };

    controlRef.current = {
      redraw: () => {
        if (raf !== 0) return;
        step(0);
        draw();
      },
      setStill: (next) => {
        if (next) {
          stop();
          step(0);
          draw();
        } else {
          start();
        }
      },
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
      draw();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) start();
      else stop();
    });
    intersectionObserver.observe(container);
    const onVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (live.current.still) {
      step(0);
      draw();
    }
    start();

    return () => {
      stop();
      controlRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      program.remove();
      try {
        container.removeChild(canvas);
      } catch {
        /* ignore */
      }
      // Release the context now; browsers cap live WebGL contexts per page.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [streamAnalyser]);

  useEffect(() => {
    controlRef.current?.setStill(still);
  }, [still]);

  // A still orb redraws when what it shows changes.
  useEffect(() => {
    if (still) controlRef.current?.redraw();
  }, [still, state, colorList, grain, inputLevel, outputLevel]);

  return (
    <div
      data-slot="audio-orb"
      data-state={state}
      className={`relative ${size == null ? "size-full" : "inline-block shrink-0"} ${className}`.trim()}
      style={{ position: "relative", ...(size == null ? { width: "100%", height: "100%" } : { width: size, height: size }), ...style }}
    >
      <div ref={containerRef} aria-hidden="true" style={{ position: "absolute", inset: 0 }} />
      {shouldReduceMotion ? <StateGlyph state={state} /> : null}
      {announce ? (
        <span role="status" className="sr-only">
          {labels[state]}
        </span>
      ) : null}
    </div>
  );
};

/** With reduced motion the still orb carries a mark for each state, so the state is not shown by motion alone. */
function StateGlyph({ state }: { state: AudioOrbState }) {
  return (
    <svg
      data-slot="audio-orb-glyph"
      aria-hidden="true"
      viewBox="0 0 100 100"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <g stroke="#ffffff" fill="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity="0.92" style={{ filter: "drop-shadow(0 0.5px 1.5px rgb(0 0 0 / 0.35))" }}>
        {state === "idle" ? <circle cx="50" cy="50" r="3" stroke="none" /> : null}
        {state === "listening" ? (
          <>
            <rect x="46" y="39" width="8" height="13" rx="4" stroke="none" />
            <path d="M42 49a8 8 0 0 0 16 0M50 57v4" fill="none" />
          </>
        ) : null}
        {state === "thinking" ? (
          <>
            <circle cx="42" cy="50" r="2.4" stroke="none" />
            <circle cx="50" cy="50" r="2.4" stroke="none" />
            <circle cx="58" cy="50" r="2.4" stroke="none" />
          </>
        ) : null}
        {state === "speaking" ? <path d="M41 47v6M45.5 43v14M50 40v20M54.5 43v14M59 47v6" fill="none" /> : null}
      </g>
    </svg>
  );
}

export default AudioOrb;
