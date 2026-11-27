"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";

export type ConfettiShape = "square" | "circle" | "strip";

export interface ConfettiOptions {
  /** Element to burst from (its center). Takes precedence over `origin`. */
  element?: Element | null;
  /** Viewport point in CSS px to burst from. Default: the center of the viewport. */
  origin?: { x: number; y: number };
  /** Number of pieces. Default 80. */
  particleCount?: number;
  /** Launch direction in degrees: 90 is straight up, 0 is right. Default 90. */
  angle?: number;
  /** Width of the cone in degrees. Default 70. */
  spread?: number;
  /** Launch speed in px per frame at 60fps. Default 11. */
  startVelocity?: number;
  /** Downward pull per frame. Default 0.32. */
  gravity?: number;
  /** Velocity kept each frame, 0–1. Lower stops pieces sooner. Default 0.93. */
  decay?: number;
  /** Sideways wind per frame. Default 0. */
  drift?: number;
  /** Frames each piece lives at 60fps. Default 170. */
  ticks?: number;
  /** Any canvas color strings. CSS variables are resolved against the document. */
  colors?: string[];
  /** Piece shapes, picked at random. Default all three. */
  shapes?: ConfettiShape[];
  /** Size multiplier. Default 1. */
  scalar?: number;
  /** Skip the burst when the user prefers reduced motion. Default true. */
  disableForReducedMotion?: boolean;
  /** z-index of the overlay canvas. Default 100. */
  zIndex?: number;
}

const DEFAULT_COLORS = ["#f5a524", "#e5484d", "#3e63dd", "#30a46c", "#8e4ec6", "#f76b15"];
const DEFAULT_SHAPES: ConfettiShape[] = ["square", "circle", "strip"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  decay: number;
  drift: number;
  rotation: number;
  spin: number;
  wobble: number;
  wobbleSpeed: number;
  size: number;
  color: string;
  shape: ConfettiShape;
  age: number;
  life: number;
};

type Overlay = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  particles: Particle[];
  frame: number;
  lastTime: number;
  waiters: (() => void)[];
  dpr: number;
};

// One canvas is shared by every burst on the page. It is created on the first
// burst and removed as soon as the last piece has fallen.
let overlay: Overlay | null = null;

function resolveColor(color: string) {
  const match = /^var\((--[^,)]+)(?:,\s*(.+))?\)$/.exec(color.trim());
  if (!match) return color;
  const value = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return value || match[2] || "#888";
}

function sizeCanvas(target: Overlay) {
  target.dpr = Math.min(window.devicePixelRatio || 1, 2);
  target.canvas.width = Math.round(window.innerWidth * target.dpr);
  target.canvas.height = Math.round(window.innerHeight * target.dpr);
}

function ensureOverlay(zIndex: number): Overlay | null {
  if (overlay) {
    overlay.canvas.style.zIndex = String(zIndex);
    return overlay;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.slot = "confetti";
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: String(zIndex),
  });
  document.body.appendChild(canvas);
  overlay = { canvas, context, particles: [], frame: 0, lastTime: 0, waiters: [], dpr: 1 };
  sizeCanvas(overlay);
  window.addEventListener("resize", onResize);
  return overlay;
}

function onResize() {
  if (overlay) sizeCanvas(overlay);
}

function teardown() {
  if (!overlay) return;
  const { canvas, waiters } = overlay;
  window.removeEventListener("resize", onResize);
  canvas.remove();
  overlay = null;
  for (const resolve of waiters) resolve();
}

function drawParticle(context: CanvasRenderingContext2D, particle: Particle) {
  const progress = particle.age / particle.life;
  // Full opacity for most of the flight, then a quick fade at the end.
  const alpha = progress < 0.7 ? 1 : Math.max(0, 1 - (progress - 0.7) / 0.3);
  // The wobble squashes the piece on one axis so it reads as flipping.
  const flip = Math.cos(particle.wobble);
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = particle.color;
  context.translate(particle.x, particle.y);
  context.rotate(particle.rotation);
  context.scale(1, flip);
  const s = particle.size;
  if (particle.shape === "circle") {
    context.beginPath();
    context.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    context.fill();
  } else if (particle.shape === "strip") {
    context.fillRect(-s * 0.25, -s * 0.9, s * 0.5, s * 1.8);
  } else {
    context.fillRect(-s * 0.5, -s * 0.5, s, s);
  }
  context.restore();
}

function tick(time: number) {
  const target = overlay;
  if (!target) return;
  // Steps are measured in 60fps frames so the motion is the same on 120Hz screens.
  const step = target.lastTime ? Math.min((time - target.lastTime) / (1000 / 60), 3) : 1;
  target.lastTime = time;
  const { context, canvas, dpr } = target;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  target.particles = target.particles.filter((particle) => {
    const keep = Math.pow(particle.decay, step);
    particle.vx = particle.vx * keep + particle.drift * step;
    particle.vy = particle.vy * keep + particle.gravity * step;
    particle.x += particle.vx * step;
    particle.y += particle.vy * step;
    particle.rotation += particle.spin * step;
    particle.wobble += particle.wobbleSpeed * step;
    particle.age += step;
    if (particle.age >= particle.life || particle.y > window.innerHeight + 40) return false;
    drawParticle(context, particle);
    return true;
  });

  if (target.particles.length) {
    target.frame = requestAnimationFrame(tick);
  } else {
    teardown();
  }
}

/**
 * Fire a burst of confetti. Returns a promise that resolves when every piece
 * on the page has finished falling. Safe to call during server rendering: it
 * does nothing there.
 */
export function confetti(options: ConfettiOptions = {}): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") return Promise.resolve();
  const {
    element,
    origin,
    particleCount = 80,
    angle = 90,
    spread = 70,
    startVelocity = 11,
    gravity = 0.32,
    decay = 0.93,
    drift = 0,
    ticks = 170,
    colors = DEFAULT_COLORS,
    shapes = DEFAULT_SHAPES,
    scalar = 1,
    disableForReducedMotion = true,
    zIndex = 100,
  } = options;

  if (disableForReducedMotion && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }

  let x = origin?.x ?? window.innerWidth / 2;
  let y = origin?.y ?? window.innerHeight / 2;
  if (element) {
    const rect = element.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  const target = ensureOverlay(zIndex);
  if (!target) return Promise.resolve();

  const palette = (colors.length ? colors : DEFAULT_COLORS).map(resolveColor);
  const shapeList = shapes.length ? shapes : DEFAULT_SHAPES;
  const base = (angle * Math.PI) / 180;
  const cone = (spread * Math.PI) / 180;

  for (let index = 0; index < Math.max(0, Math.round(particleCount)); index += 1) {
    const direction = base + (Math.random() - 0.5) * cone;
    const speed = startVelocity * (0.55 + Math.random() * 0.6);
    target.particles.push({
      x,
      y,
      vx: Math.cos(direction) * speed,
      // Canvas y grows downward, so "up" is negative.
      vy: -Math.sin(direction) * speed,
      gravity: gravity * (0.85 + Math.random() * 0.3),
      decay,
      drift: drift + (Math.random() - 0.5) * 0.04,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.08 + Math.random() * 0.14,
      size: (5 + Math.random() * 4) * scalar,
      color: palette[Math.floor(Math.random() * palette.length)],
      shape: shapeList[Math.floor(Math.random() * shapeList.length)],
      age: 0,
      life: ticks * (0.8 + Math.random() * 0.4),
    });
  }

  const done = new Promise<void>((resolve) => target.waiters.push(resolve));
  // Start the loop only for a new overlay; a running loop picks up the new pieces.
  if (!target.frame) {
    target.lastTime = 0;
    target.frame = requestAnimationFrame(tick);
  }
  return done;
}

/**
 * Returns a ref for the element to burst from and a function that fires from
 * it. Options passed to the function override the hook's defaults.
 */
export function useConfetti<T extends Element = HTMLElement>(
  defaults: ConfettiOptions = {},
): [RefObject<T | null>, (options?: ConfettiOptions) => Promise<void>] {
  const ref = useRef<T>(null);
  const fire = useCallback(
    (options: ConfettiOptions = {}) => confetti({ element: ref.current, ...defaults, ...options }),
    [defaults],
  );
  return [ref, fire];
}

export interface ConfettiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Burst options. The burst starts from the button's center. */
  options?: ConfettiOptions;
}

/** A button that fires confetti from itself when clicked, then calls `onClick`. */
export const ConfettiButton = forwardRef<HTMLButtonElement, ConfettiButtonProps>(function ConfettiButton(
  { options, onClick, className, type = "button", ...props },
  forwardedRef,
) {
  const innerRef = useRef<HTMLButtonElement>(null);
  useImperativeHandle(forwardedRef, () => innerRef.current as HTMLButtonElement);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    void confetti({ element: innerRef.current, ...options });
    onClick?.(event);
  };

  return (
    <button
      ref={innerRef}
      type={type}
      data-slot="confetti-button"
      onClick={handleClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
});
