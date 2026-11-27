"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { Mesh, Program, RenderTarget, Renderer, Triangle } from "ogl";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export interface FluidProps {
  /** Freeze the simulation on its current frame. */
  paused?: boolean;
  /**
   * Dye colors for splats, picked in turn. Leave empty for a slowly turning
   * rainbow.
   */
  colors?: string[];
  /** Brightness of each splat's dye. */
  colorIntensity?: number;
  /** How quickly the dye fades. 0 keeps it forever. */
  densityDissipation?: number;
  /** How quickly motion settles. 0 keeps it moving forever. */
  velocityDissipation?: number;
  /** How much pressure carries over between frames, from 0 to 1. */
  pressure?: number;
  /** Pressure solver passes per frame. More is smoother and costs more. */
  pressureIterations?: number;
  /** Strength of the swirl that keeps small eddies alive. */
  curl?: number;
  /** Splat radius as a share of the shorter side, from 0.01 to 1. */
  splatRadius?: number;
  /** How hard pointer movement pushes the fluid. */
  splatForce?: number;
  /** Grid size of the velocity simulation along the shorter side. */
  simResolution?: number;
  /** Grid size of the dye along the shorter side. */
  dyeResolution?: number;
  /** Light the dye from its gradient so it reads as a surface. */
  shading?: boolean;
  /** Draw dye over a transparent canvas instead of `backgroundColor`. */
  transparent?: boolean;
  /** Canvas color when `transparent` is false. */
  backgroundColor?: string;
  /** Stir the fluid on its own while nobody is interacting. */
  autoSplats?: boolean;
  /** Listen for pointer movement on the whole window, not just the container. */
  listenOnWindow?: boolean;
  className?: string;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    default: return [v, p, q];
  }
};

// Every pass draws one full-screen triangle. vUv addresses the current cell
// and the four neighbors are precomputed for the stencil passes.
const baseVertex = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
uniform vec2 uTexel;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
void main() {
  vUv = uv;
  vL = uv - vec2(uTexel.x, 0.0);
  vR = uv + vec2(uTexel.x, 0.0);
  vT = uv + vec2(0.0, uTexel.y);
  vB = uv - vec2(0.0, uTexel.y);
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const splatFragment = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec3 uColor;
uniform vec2 uPoint;
uniform float uRadius;
out vec4 fragColor;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
  fragColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}
`;

const advectionFragment = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
out vec4 fragColor;
void main() {
  // Trace each cell backwards along the flow and take what was there.
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  vec4 result = texture(uSource, coord);
  fragColor = result / (1.0 + uDissipation * uDt);
}
`;

const divergenceFragment = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  // Walls: mirror the velocity at the edges so nothing leaks out.
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}
`;

const curlFragment = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}
`;

const vorticityFragment = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uCurlStrength;
uniform float uDt;
out vec4 fragColor;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  // Push along the curl gradient to restore swirls that numerical
  // diffusion would otherwise smear away.
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurlStrength * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy + force * uDt;
  velocity = clamp(velocity, -1000.0, 1000.0);
  fragColor = vec4(velocity, 0.0, 1.0);
}
`;

const clearFragment = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;
out vec4 fragColor;
void main() {
  fragColor = uValue * texture(uTexture, vUv);
}
`;

const pressureFragment = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
out vec4 fragColor;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  // One Jacobi step toward a pressure field with zero divergence.
  fragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}
`;

const gradientSubtractFragment = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}
`;

const displayFragment = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uDye;
uniform float uShading;
uniform float uTransparent;
uniform vec3 uBackground;
out vec4 fragColor;
void main() {
  vec3 color = texture(uDye, vUv).rgb;
  if (uShading > 0.5) {
    // Light the dye as a height field so folds and edges catch light.
    float dx = length(texture(uDye, vR).rgb) - length(texture(uDye, vL).rgb);
    float dy = length(texture(uDye, vT).rgb) - length(texture(uDye, vB).rgb);
    vec3 normal = normalize(vec3(dx, dy, 0.6));
    float diffuse = clamp(dot(normal, normalize(vec3(0.0, 0.0, 1.0))) + 0.7, 0.7, 1.0);
    color *= diffuse;
  }
  // Soft tone curve: bright splats roll off instead of clipping to white.
  color = 1.0 - exp(-color * 2.6);
  if (uTransparent > 0.5) {
    float alpha = clamp(max(color.r, max(color.g, color.b)), 0.0, 1.0);
    fragColor = vec4(color, alpha);
  } else {
    fragColor = vec4(uBackground * (1.0 - clamp(max(color.r, max(color.g, color.b)), 0.0, 1.0)) + color, 1.0);
  }
}
`;

// The simulation needs WebGL2 and color buffers it can render half floats
// into. The probe runs once per page on the client; the server and the first
// client render assume support so markup matches.
let floatSupport: boolean | null = null;
const probeFloatSupport = () => {
  if (floatSupport !== null) return floatSupport;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    floatSupport = !!gl && (!!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float"));
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    floatSupport = false;
  }
  return floatSupport;
};
const subscribeNoop = () => () => {};

type DoubleTarget = {
  read: RenderTarget;
  write: RenderTarget;
  swap: () => void;
};

type FluidSettings = Required<Omit<FluidProps, "className" | "paused" | "listenOnWindow">>;

const DEFAULT_SETTINGS: FluidSettings = {
  colors: [],
  colorIntensity: 0.15,
  densityDissipation: 1,
  velocityDissipation: 0.2,
  pressure: 0.8,
  pressureIterations: 20,
  curl: 28,
  splatRadius: 0.22,
  splatForce: 6000,
  simResolution: 128,
  dyeResolution: 1024,
  shading: true,
  transparent: false,
  backgroundColor: "#0b0d12",
  autoSplats: true,
};

const Fluid: React.FC<FluidProps> = ({
  paused = false,
  colors = DEFAULT_SETTINGS.colors,
  colorIntensity = DEFAULT_SETTINGS.colorIntensity,
  densityDissipation = DEFAULT_SETTINGS.densityDissipation,
  velocityDissipation = DEFAULT_SETTINGS.velocityDissipation,
  pressure = DEFAULT_SETTINGS.pressure,
  pressureIterations = DEFAULT_SETTINGS.pressureIterations,
  curl = DEFAULT_SETTINGS.curl,
  splatRadius = DEFAULT_SETTINGS.splatRadius,
  splatForce = DEFAULT_SETTINGS.splatForce,
  simResolution = DEFAULT_SETTINGS.simResolution,
  dyeResolution = DEFAULT_SETTINGS.dyeResolution,
  shading = DEFAULT_SETTINGS.shading,
  transparent = DEFAULT_SETTINGS.transparent,
  backgroundColor = DEFAULT_SETTINGS.backgroundColor,
  autoSplats = DEFAULT_SETTINGS.autoSplats,
  listenOnWindow = false,
  className = "",
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isPaused = paused || shouldReduceMotion;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const unsupported = !useSyncExternalStore(subscribeNoop, probeFloatSupport, () => true);

  // Live settings are read by the render loop every frame, so changing a
  // prop never rebuilds the simulation or clears the dye.
  const settingsRef = useRef<FluidSettings>({ ...DEFAULT_SETTINGS });
  useEffect(() => {
    settingsRef.current = {
      colors,
      colorIntensity,
      densityDissipation,
      velocityDissipation,
      pressure,
      pressureIterations,
      curl,
      splatRadius,
      splatForce,
      simResolution,
      dyeResolution,
      shading,
      transparent,
      backgroundColor,
      autoSplats,
    };
  }, [
    colors, colorIntensity, densityDissipation, velocityDissipation, pressure,
    pressureIterations, curl, splatRadius, splatForce, simResolution,
    dyeResolution, shading, transparent, backgroundColor, autoSplats,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || unsupported) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return;
    }
    const gl = renderer.gl;
    const isWebGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
    // Rendering into half-float textures needs a color-buffer extension. Without
    // it the velocity field cannot be stored, so the component falls back.
    const canRenderFloat = isWebGL2 && (!!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float"));
    if (!canRenderFloat) return;
    const gl2 = gl as WebGL2RenderingContext;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const makeProgram = (fragment: string, uniforms: Record<string, { value: unknown }>) =>
      new Program(gl, {
        vertex: baseVertex,
        fragment,
        uniforms: { uTexel: { value: [0, 0] }, ...uniforms },
        depthTest: false,
        depthWrite: false,
        cullFace: false,
      });

    const programs = {
      splat: makeProgram(splatFragment, {
        uTarget: { value: null },
        uAspect: { value: 1 },
        uColor: { value: [0, 0, 0] },
        uPoint: { value: [0, 0] },
        uRadius: { value: 0.01 },
      }),
      advection: makeProgram(advectionFragment, {
        uVelocity: { value: null },
        uSource: { value: null },
        uDt: { value: 0 },
        uDissipation: { value: 0 },
      }),
      divergence: makeProgram(divergenceFragment, { uVelocity: { value: null } }),
      curl: makeProgram(curlFragment, { uVelocity: { value: null } }),
      vorticity: makeProgram(vorticityFragment, {
        uVelocity: { value: null },
        uCurl: { value: null },
        uCurlStrength: { value: 0 },
        uDt: { value: 0 },
      }),
      clear: makeProgram(clearFragment, { uTexture: { value: null }, uValue: { value: 0 } }),
      pressure: makeProgram(pressureFragment, { uPressure: { value: null }, uDivergence: { value: null } }),
      gradient: makeProgram(gradientSubtractFragment, { uPressure: { value: null }, uVelocity: { value: null } }),
      display: makeProgram(displayFragment, {
        uDye: { value: null },
        uShading: { value: 1 },
        uTransparent: { value: 0 },
        uBackground: { value: [0, 0, 0] },
      }),
    };
    const meshes = Object.fromEntries(
      Object.entries(programs).map(([key, program]) => [key, new Mesh(gl, { geometry, program })]),
    ) as Record<keyof typeof programs, Mesh>;

    const createTarget = (width: number, height: number, linear: boolean) =>
      new RenderTarget(gl, {
        width,
        height,
        depth: false,
        type: gl2.HALF_FLOAT,
        format: gl.RGBA,
        internalFormat: gl2.RGBA16F,
        minFilter: linear ? gl.LINEAR : gl.NEAREST,
        magFilter: linear ? gl.LINEAR : gl.NEAREST,
      });
    const createDouble = (width: number, height: number, linear: boolean): DoubleTarget => {
      const pair = {
        read: createTarget(width, height, linear),
        write: createTarget(width, height, linear),
        swap() {
          const read = pair.read;
          pair.read = pair.write;
          pair.write = read;
        },
      };
      return pair;
    };

    const gridSize = (resolution: number) => {
      const aspect = gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight);
      const min = Math.max(8, Math.round(resolution));
      const max = Math.round(min * (aspect > 1 ? aspect : 1 / aspect));
      return aspect > 1 ? { width: max, height: min } : { width: min, height: max };
    };

    let velocity: DoubleTarget;
    let dye: DoubleTarget;
    let pressureTarget: DoubleTarget;
    let divergence: RenderTarget;
    let curlTarget: RenderTarget;
    let builtFor = { sim: 0, dye: 0, width: 0, height: 0 };

    const deleteTarget = (target: RenderTarget | undefined) => {
      if (!target) return;
      gl.deleteFramebuffer(target.buffer);
      for (const texture of target.textures) gl.deleteTexture(texture.texture);
    };
    const deleteAll = () => {
      for (const pair of [velocity, dye, pressureTarget]) {
        if (!pair) continue;
        deleteTarget(pair.read);
        deleteTarget(pair.write);
      }
      deleteTarget(divergence);
      deleteTarget(curlTarget);
    };

    const buildTargets = () => {
      const { simResolution: sim, dyeResolution: dyeRes } = settingsRef.current;
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      if (
        builtFor.sim === sim &&
        builtFor.dye === dyeRes &&
        builtFor.width === width &&
        builtFor.height === height
      ) {
        return;
      }
      deleteAll();
      const simSize = gridSize(sim);
      const dyeSize = gridSize(Math.min(dyeRes, Math.max(width, height)));
      velocity = createDouble(simSize.width, simSize.height, true);
      dye = createDouble(dyeSize.width, dyeSize.height, true);
      pressureTarget = createDouble(simSize.width, simSize.height, false);
      divergence = createTarget(simSize.width, simSize.height, false);
      curlTarget = createTarget(simSize.width, simSize.height, false);
      builtFor = { sim, dye: dyeRes, width, height };
    };

    const run = (key: keyof typeof programs, target: RenderTarget | null, texel: [number, number]) => {
      (programs[key].uniforms.uTexel as { value: number[] }).value = texel;
      renderer.render({ scene: meshes[key], target: target ?? undefined, clear: false });
    };
    const texelOf = (target: RenderTarget): [number, number] => [1 / target.width, 1 / target.height];
    const setUniform = (key: keyof typeof programs, name: string, value: unknown) => {
      (programs[key].uniforms[name] as { value: unknown }).value = value;
    };

    // Splat colors: the palette in turn, or a hue that steps by the golden
    // ratio so consecutive splats never repeat a color.
    let colorIndex = 0;
    let hue = 0.62;
    const nextColor = (): [number, number, number] => {
      const { colors: palette, colorIntensity: intensity } = settingsRef.current;
      let rgb: [number, number, number];
      if (palette.length) {
        rgb = hexToRgb(palette[colorIndex % palette.length]);
        colorIndex += 1;
      } else {
        hue = (hue + 0.618034) % 1;
        rgb = hsvToRgb(hue, 1, 1);
      }
      return [rgb[0] * intensity, rgb[1] * intensity, rgb[2] * intensity];
    };

    const splat = (x: number, y: number, dx: number, dy: number, color: [number, number, number]) => {
      const aspect = gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight);
      const radius = (Math.min(Math.max(settingsRef.current.splatRadius, 0.01), 1) / 100) * (aspect > 1 ? aspect : 1);
      setUniform("splat", "uAspect", aspect);
      setUniform("splat", "uPoint", [x, y]);
      setUniform("splat", "uRadius", radius);

      setUniform("splat", "uTarget", velocity.read.texture);
      setUniform("splat", "uColor", [dx, dy, 0]);
      run("splat", velocity.write, texelOf(velocity.write));
      velocity.swap();

      setUniform("splat", "uTarget", dye.read.texture);
      setUniform("splat", "uColor", color);
      run("splat", dye.write, texelOf(dye.write));
      dye.swap();
    };

    const step = (dt: number) => {
      const s = settingsRef.current;
      const simTexel = texelOf(velocity.read);

      setUniform("curl", "uVelocity", velocity.read.texture);
      run("curl", curlTarget, simTexel);

      setUniform("vorticity", "uVelocity", velocity.read.texture);
      setUniform("vorticity", "uCurl", curlTarget.texture);
      setUniform("vorticity", "uCurlStrength", s.curl);
      setUniform("vorticity", "uDt", dt);
      run("vorticity", velocity.write, simTexel);
      velocity.swap();

      setUniform("divergence", "uVelocity", velocity.read.texture);
      run("divergence", divergence, simTexel);

      setUniform("clear", "uTexture", pressureTarget.read.texture);
      setUniform("clear", "uValue", Math.min(Math.max(s.pressure, 0), 1));
      run("clear", pressureTarget.write, simTexel);
      pressureTarget.swap();

      setUniform("pressure", "uDivergence", divergence.texture);
      const iterations = Math.max(1, Math.min(80, Math.round(s.pressureIterations)));
      for (let i = 0; i < iterations; i += 1) {
        setUniform("pressure", "uPressure", pressureTarget.read.texture);
        run("pressure", pressureTarget.write, simTexel);
        pressureTarget.swap();
      }

      setUniform("gradient", "uPressure", pressureTarget.read.texture);
      setUniform("gradient", "uVelocity", velocity.read.texture);
      run("gradient", velocity.write, simTexel);
      velocity.swap();

      setUniform("advection", "uVelocity", velocity.read.texture);
      setUniform("advection", "uSource", velocity.read.texture);
      setUniform("advection", "uDt", dt);
      setUniform("advection", "uDissipation", Math.max(0, s.velocityDissipation));
      run("advection", velocity.write, simTexel);
      velocity.swap();

      setUniform("advection", "uVelocity", velocity.read.texture);
      setUniform("advection", "uSource", dye.read.texture);
      setUniform("advection", "uDissipation", Math.max(0, s.densityDissipation));
      run("advection", dye.write, simTexel);
      dye.swap();
    };

    const draw = () => {
      const s = settingsRef.current;
      setUniform("display", "uDye", dye.read.texture);
      setUniform("display", "uShading", s.shading ? 1 : 0);
      setUniform("display", "uTransparent", s.transparent ? 1 : 0);
      setUniform("display", "uBackground", hexToRgb(s.backgroundColor));
      run("display", null, texelOf(dye.read));
    };

    // A few splats so a first frame (and the reduced-motion still) has color.
    const seed = () => {
      const points: [number, number, number, number][] = [
        [0.28, 0.42, 1, 0.6],
        [0.52, 0.62, -0.4, -1],
        [0.74, 0.38, -0.8, 0.7],
      ];
      for (const [x, y, dx, dy] of points) {
        splat(x, y, dx * 900, dy * 900, nextColor());
      }
    };

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      const hadTargets = builtFor.width > 0;
      buildTargets();
      if (!hadTargets) seed();
      draw();
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(container);
    setSize();

    // Pointer input. Splats are queued and applied at the start of the next
    // frame so several move events in one frame stay cheap.
    type PendingSplat = { x: number; y: number; dx: number; dy: number; color: [number, number, number] };
    const pending: PendingSplat[] = [];
    let lastPointer: { x: number; y: number } | null = null;
    let pointerColor = nextColor();
    let lastInteraction = -Infinity;
    const eventTarget: HTMLElement | Window = listenOnWindow ? window : container;

    const toLocal = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / Math.max(1, rect.width),
        y: 1 - (event.clientY - rect.top) / Math.max(1, rect.height),
        inside:
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom,
      };
    };
    const onPointerMove = (event: Event) => {
      if (isPaused) return;
      const point = toLocal(event as PointerEvent);
      if (!point.inside) {
        lastPointer = null;
        return;
      }
      lastInteraction = performance.now();
      if (lastPointer) {
        const dx = point.x - lastPointer.x;
        const dy = point.y - lastPointer.y;
        if (dx !== 0 || dy !== 0) {
          const aspect = gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight);
          const force = settingsRef.current.splatForce;
          pending.push({
            x: point.x,
            y: point.y,
            dx: dx * force * (aspect < 1 ? aspect : 1),
            dy: dy * force * (aspect > 1 ? 1 / aspect : 1),
            color: pointerColor,
          });
        }
      }
      lastPointer = { x: point.x, y: point.y };
    };
    const onPointerDown = (event: Event) => {
      if (isPaused) return;
      const point = toLocal(event as PointerEvent);
      if (!point.inside) return;
      lastInteraction = performance.now();
      pointerColor = nextColor();
      // A click is a burst: a strong splat in a random-feeling direction.
      const angle = (performance.now() * 0.0137) % (Math.PI * 2);
      pending.push({
        x: point.x,
        y: point.y,
        dx: Math.cos(angle) * 1200,
        dy: Math.sin(angle) * 1200,
        color: pointerColor.map((channel) => channel * 6) as [number, number, number],
      });
      lastPointer = { x: point.x, y: point.y };
    };
    const onPointerLeave = () => {
      lastPointer = null;
    };
    eventTarget.addEventListener("pointermove", onPointerMove, { passive: true });
    eventTarget.addEventListener("pointerdown", onPointerDown, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave);

    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    let lastTime = performance.now();
    let lastAuto = 0;
    let colorTimer = 0;
    const t0 = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;
      buildTargets();

      // Each color runs for a while before the next takes over, so separate
      // hues survive in the dye instead of mixing into one average tint.
      colorTimer += dt;
      if (colorTimer > 1.6) {
        colorTimer = 0;
        pointerColor = nextColor();
      }

      // Idle motion: a slow Lissajous path stirs the fluid until someone
      // moves the pointer, and resumes a few seconds after they stop.
      const s = settingsRef.current;
      if (s.autoSplats && now - lastInteraction > 2500 && now - lastAuto > 140) {
        lastAuto = now;
        const t = (now - t0) / 1000;
        const x = 0.5 + 0.32 * Math.sin(t * 0.53) * Math.cos(t * 0.21);
        const y = 0.5 + 0.28 * Math.sin(t * 0.37 + 1.3);
        const vx = Math.cos(t * 0.53) * 0.53 * 0.32;
        const vy = Math.cos(t * 0.37 + 1.3) * 0.37 * 0.28;
        pending.push({ x, y, dx: vx * s.splatForce * 0.5, dy: vy * s.splatForce * 0.5, color: pointerColor });
      }

      for (const item of pending.splice(0)) {
        splat(item.x, item.y, item.dx, item.dy, item.color);
      }
      step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };

    const tryStart = () => {
      if (!isPaused && isVisible && isPageVisible && raf === 0) {
        lastTime = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    if (isPaused) {
      // Reduced motion or paused: let the seed splats settle into a still
      // image instead of animating.
      for (let i = 0; i < 24; i += 1) step(1 / 60);
      draw();
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) tryStart();
        else tryStop();
      },
      { threshold: 0 },
    );
    io.observe(container);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) tryStart();
      else tryStop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    tryStart();

    return () => {
      tryStop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      eventTarget.removeEventListener("pointermove", onPointerMove);
      eventTarget.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerleave", onPointerLeave);
      deleteAll();
      for (const program of Object.values(programs)) program.remove();
      geometry.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      try {
        container.removeChild(canvas);
      } catch {
        /* ignore */
      }
    };
  }, [isPaused, listenOnWindow, unsupported]);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className={`relative size-full overflow-hidden ${className}`.trim()}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        // Static stand-in when WebGL2 or float render targets are missing.
        background: unsupported
          ? `radial-gradient(60% 60% at 30% 40%, ${colors[0] ?? "#5b8cff"}55, transparent 70%), radial-gradient(50% 50% at 70% 60%, ${colors[1] ?? "#ff6ad5"}44, transparent 70%)${transparent ? "" : `, ${backgroundColor}`}`
          : undefined,
      }}
    />
  );
};

export default Fluid;
