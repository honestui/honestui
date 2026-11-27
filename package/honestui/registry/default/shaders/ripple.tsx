"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";
import { effectContainerClass, useCssColors } from "./effect-canvas";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export type RippleTrigger = "pointer" | "click";

export interface RippleProps {
  /** Image to ripple, fitted like `object-fit: cover`. Without it the ripples are drawn as light and shade. */
  src?: string;
  /** Alternative text for the image. Leave empty when the image is decorative. */
  alt?: string;
  /** Color of the ripples' light and shade when there is no image. Any CSS color. */
  color?: string;
  /** Fill behind the ripples when there is no image. Defaults to transparent. */
  background?: string;
  /** What starts a ripple: moving the pointer, or a click or tap. */
  trigger?: RippleTrigger;
  /** How far the waves bend the image, in CSS pixels. Also sets how bright the crests are. */
  strength?: number;
  /** Distance between wave crests in CSS pixels. */
  wavelength?: number;
  /** How fast a ripple spreads, in CSS pixels per second. */
  rippleSpeed?: number;
  /** How quickly a ripple fades. Higher values fade sooner. */
  decay?: number;
  /** Drop a ripple in a random spot every this many milliseconds. 0 turns it off. */
  autoplay?: number;
  /** Overall animation speed. */
  speed?: number;
  /** Freeze the ripples and stop new ones. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const MAX_RIPPLES = 10;

const VERTEX = /* glsl */ `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform float uTime;
uniform vec4 uRipples[${MAX_RIPPLES}];
uniform float uStrength;
uniform float uWavelength;
uniform float uSpeed;
uniform float uDecay;
uniform sampler2D uImage;
uniform vec2 uImageSize;
uniform float uHasImage;
uniform vec4 uColor;
uniform vec4 uBackground;
out vec4 fragColor;

const float PI = 3.14159265;

// Height of the water surface and its gradient, both in CSS pixel units.
// Each ripple is a short wave packet travelling outward from where it began,
// fading with age and with distance.
vec3 surface(vec2 p) {
  float height = 0.0;
  vec2 gradient = vec2(0.0);
  float k = 2.0 * PI / max(uWavelength, 4.0);
  float packet = uWavelength * 0.95;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    if (r.w <= 0.0) continue;
    float age = uTime - r.z;
    if (age < 0.0) continue;
    vec2 d = p - r.xy;
    float dist = length(d);
    float front = age * uSpeed;
    float x = dist - front;
    float envelope = exp(-(x * x) / (packet * packet)) * exp(-age * uDecay) * r.w;
    // Spreading rings get weaker; the center stays calm once the ring has left.
    envelope *= 1.0 / (1.0 + front * 0.004);
    envelope *= smoothstep(0.0, uWavelength * 0.6, dist);
    float wave = sin(x * k);
    height += wave * envelope;
    vec2 dir = dist > 1e-3 ? d / dist : vec2(0.0);
    float slope = (cos(x * k) * k - wave * 2.0 * x / (packet * packet)) * envelope;
    gradient += dir * slope;
  }
  return vec3(height, gradient);
}

vec2 coverUv(vec2 uv) {
  float canvasAspect = uResolution.x / max(uResolution.y, 1.0);
  float imageAspect = uImageSize.x / max(uImageSize.y, 1.0);
  if (imageAspect > canvasAspect) {
    uv.x = (uv.x - 0.5) * canvasAspect / imageAspect + 0.5;
  } else {
    uv.y = (uv.y - 0.5) * imageAspect / canvasAspect + 0.5;
  }
  return uv;
}

void main() {
  vec2 p = gl_FragCoord.xy / uPixelRatio;
  vec2 size = uResolution / uPixelRatio;
  vec3 s = surface(p);
  vec2 slope = s.yz * (uWavelength / (2.0 * PI));
  // Light from the upper left: crests facing it brighten, the far sides darken.
  float light = dot(slope, normalize(vec2(-0.6, 0.8)));

  if (uHasImage > 0.5) {
    vec2 offset = slope * uStrength;
    vec2 uv = (p - offset) / size;
    vec2 imageUv = coverUv(uv);
    vec3 color = texture(uImage, clamp(imageUv, 0.0, 1.0)).rgb;
    float amount = clamp(uStrength / 12.0, 0.0, 2.0);
    // A soft sheen on the crests, screened so it brightens without washing out.
    color = 1.0 - (1.0 - color) * (1.0 - max(light, 0.0) * 0.14 * amount);
    color *= 1.0 - max(-light, 0.0) * 0.1 * amount;
    fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    return;
  }

  float shade = clamp(abs(light) * clamp(uStrength / 12.0, 0.0, 2.0), 0.0, 1.0);
  float lit = light > 0.0 ? 0.6 : 0.3;
  float alpha = shade * lit * uColor.a;
  vec3 color = mix(uBackground.rgb, uColor.rgb, uBackground.a > 0.0 ? alpha : 1.0);
  fragColor = vec4(color, uBackground.a > 0.0 ? max(uBackground.a, alpha) : alpha);
}
`;

type RippleState = { x: number; y: number; start: number; amplitude: number };

export function Ripple({
  src,
  alt = "",
  color = "currentColor",
  background = "transparent",
  trigger = "pointer",
  strength = 12,
  wavelength = 26,
  rippleSpeed = 220,
  decay = 1.1,
  autoplay = 0,
  speed = 1,
  paused = false,
  className,
  children,
}: RippleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [ink, paper] = useCssColors(containerRef, [color, background]);
  // Which source finished loading, so a new src reads as loading again.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const imageReady = src != null && loadedSrc === src;

  const settingsRef = useRef({ trigger, strength, wavelength, rippleSpeed, decay, autoplay, speed, ink, paper, still: paused || reduceMotion });
  const controlRef = useRef<{ sync: () => void; render: () => void; setImage: (image: HTMLImageElement | null) => void } | null>(null);

  useEffect(() => {
    settingsRef.current = { trigger, strength, wavelength, rippleSpeed, decay, autoplay, speed, ink, paper, still: paused || reduceMotion };
    controlRef.current?.sync();
    controlRef.current?.render();
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
    if (!renderer.isWebgl2) return;
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      transition: "opacity 300ms ease-out",
    });
    container.prepend(canvas);

    const imageTexture = new Texture(gl, {
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      width: 1,
      height: 1,
    });

    const ripples: RippleState[] = [];
    // A plain array: ogl only uploads uniform arrays it can recognise with Array.isArray.
    const rippleData: number[] = new Array(MAX_RIPPLES * 4).fill(0);
    let program: Program;
    try {
      program = new Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms: {
          uResolution: { value: [1, 1] },
          uPixelRatio: { value: 1 },
          uTime: { value: 0 },
          uRipples: { value: rippleData },
          uStrength: { value: 12 },
          uWavelength: { value: 26 },
          uSpeed: { value: 220 },
          uDecay: { value: 1 },
          uImage: { value: imageTexture },
          uImageSize: { value: [1, 1] },
          uHasImage: { value: 0 },
          uColor: { value: [0, 0, 0, 1] },
          uBackground: { value: [0, 0, 0, 0] },
        },
        transparent: false,
        depthTest: false,
        depthWrite: false,
      });
    } catch {
      container.removeChild(canvas);
      return;
    }
    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });

    let time = 0;
    let raf = 0;
    let lastFrame = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    let hasImage = false;
    // Set on unmount so a frame or callback that was already queued cannot draw with freed buffers.
    let disposed = false;

    // How long a ripple stays visible: until its envelope has faded below about 1%.
    const lifetime = () => 4.6 / Math.max(settingsRef.current.decay, 0.05);
    const alive = () => ripples.some((ripple) => time - ripple.start < lifetime());

    const draw = () => {
      if (disposed) return;
      const settings = settingsRef.current;
      ripples.splice(0, ripples.length, ...ripples.filter((ripple) => time - ripple.start < lifetime()));
      rippleData.fill(0);
      ripples.slice(-MAX_RIPPLES).forEach((ripple, index) => {
        rippleData.splice(index * 4, 4, ripple.x, ripple.y, ripple.start, ripple.amplitude);
      });
      const uniforms = program.uniforms as Record<string, { value: unknown }>;
      uniforms.uTime.value = time;
      uniforms.uRipples.value = [...rippleData];
      uniforms.uStrength.value = settings.strength;
      uniforms.uWavelength.value = settings.wavelength;
      uniforms.uSpeed.value = settings.rippleSpeed;
      uniforms.uDecay.value = settings.decay;
      uniforms.uColor.value = settings.ink;
      uniforms.uBackground.value = settings.paper;
      uniforms.uHasImage.value = hasImage ? 1 : 0;
      renderer.render({ scene: mesh });
    };

    const running = () => isVisible && isPageVisible && !settingsRef.current.still;
    const wantsFrames = () => running() && (alive() || settingsRef.current.autoplay > 0);

    let nextDrop = 0;
    const frame = (now: number) => {
      raf = 0;
      if (disposed) return;
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
      lastFrame = now;
      if (running()) time += delta * Math.max(settingsRef.current.speed, 0);
      const { autoplay: interval } = settingsRef.current;
      if (interval > 0 && running() && time >= nextDrop) {
        const rect = container.getBoundingClientRect();
        addRipple(rect.width * (0.15 + Math.random() * 0.7), rect.height * (0.15 + Math.random() * 0.7), 0.8);
        nextDrop = time + interval / 1000;
      }
      draw();
      // An autoplay drop above may already have queued the next frame through sync().
      if (raf === 0 && wantsFrames()) raf = requestAnimationFrame(frame);
      else if (raf === 0) lastFrame = 0;
    };
    const sync = () => {
      if (!disposed && raf === 0 && wantsFrames()) {
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    function addRipple(x: number, y: number, amplitude: number) {
      const rect = container!.getBoundingClientRect();
      ripples.push({ x, y: rect.height - y, start: time, amplitude });
      if (ripples.length > MAX_RIPPLES) ripples.splice(0, ripples.length - MAX_RIPPLES);
      sync();
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height);
      const uniforms = program.uniforms as Record<string, { value: unknown }>;
      uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
      uniforms.uPixelRatio.value = gl.drawingBufferWidth / width;
      draw();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      sync();
    });
    intersectionObserver.observe(container);
    const onVisibility = () => {
      isPageVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Pointer: moving drops small ripples spaced along the path; a click or tap drops a full one.
    let lastDrop: { x: number; y: number; at: number } | null = null;
    const local = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (settingsRef.current.still || settingsRef.current.trigger !== "pointer") return;
      const point = local(event);
      const now = performance.now();
      const spacing = settingsRef.current.wavelength * 3.5;
      if (lastDrop && (Math.hypot(point.x - lastDrop.x, point.y - lastDrop.y) < spacing || now - lastDrop.at < 90)) return;
      lastDrop = { ...point, at: now };
      addRipple(point.x, point.y, 0.45);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (settingsRef.current.still) return;
      const point = local(event);
      lastDrop = { ...point, at: performance.now() };
      addRipple(point.x, point.y, 1);
    };
    const onPointerLeave = () => {
      lastDrop = null;
    };
    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerdown", onPointerDown, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave, { passive: true });

    controlRef.current = {
      sync,
      render: () => {
        if (raf === 0) draw();
      },
      setImage: (image) => {
        hasImage = image !== null;
        if (image) {
          imageTexture.image = image;
          imageTexture.needsUpdate = true;
          (program.uniforms as Record<string, { value: unknown }>).uImageSize.value = [image.naturalWidth, image.naturalHeight];
        }
        canvas.style.opacity = "1";
        if (raf === 0) draw();
      },
    };
    sync();

    return () => {
      disposed = true;
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = 0;
      controlRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerleave", onPointerLeave);
      program.remove();
      geometry.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, []);

  // Load the image onto the GPU. Until it is there, the plain <img> below shows.
  useEffect(() => {
    if (!src) {
      controlRef.current?.setImage(null);
      return;
    }
    let cancelled = false;
    const element = new Image();
    element.crossOrigin = "anonymous";
    element.decoding = "async";
    element.onload = () => {
      if (cancelled) return;
      controlRef.current?.setImage(element);
      setLoadedSrc(src);
    };
    element.src = src;
    return () => {
      cancelled = true;
      element.onload = null;
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={effectContainerClass(className)}
      style={!src && background !== "transparent" ? { background } : undefined}
    >
      {src ? (
        // The image is the accessible content and the fallback until the canvas has its pixels.
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${imageReady ? "opacity-0" : "opacity-100"}`}
        />
      ) : null}
      {children ? <div className="relative z-10 size-full">{children}</div> : null}
    </div>
  );
}

export default Ripple;
