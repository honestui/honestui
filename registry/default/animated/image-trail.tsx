"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { EASE_OUT_CSS } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type ImageTrailVariant = "fade" | "scatter" | "stack";

export interface ImageTrailImage {
  src: string;
  /** Not announced: trail images are decorative. Kept so one list can feed other views. */
  alt?: string;
}

export interface ImageTrailProps {
  /** Images dropped along the pointer's path, used in order and repeated. */
  images: (ImageTrailImage | string)[];
  /** Content shown above the trail, such as a headline. */
  children?: ReactNode;
  /** How each image enters and leaves. Default "scatter". */
  variant?: ImageTrailVariant;
  /** Pointer travel in CSS pixels between two images. Default 80. */
  threshold?: number;
  /** Milliseconds an image stays, from appearing to gone. Default 1000. */
  duration?: number;
  /** Most images on screen at once. Default 8. */
  maxVisible?: number;
  /** Image width in CSS pixels. Default 160. */
  imageSize?: number;
  /** Image width over height. Default 4 / 5. */
  aspectRatio?: number;
  /** Also follow touch drags. Default false, so touch scrolling stays untouched. */
  touch?: boolean;
  className?: string;
  imageClassName?: string;
}

type Slot = { element: HTMLImageElement | null; animation: Animation | null };

const toImage = (image: ImageTrailImage | string): ImageTrailImage =>
  typeof image === "string" ? { src: image } : image;

/**
 * Drops images along the pointer's path. A fixed pool of <img> elements is
 * reused round-robin and animated with the Web Animations API, so moving the
 * pointer never re-renders React. With reduced motion the trail is off and
 * only the children show.
 */
export function ImageTrail({
  images,
  children,
  variant = "scatter",
  threshold = 80,
  duration = 1000,
  maxVisible = 8,
  imageSize = 160,
  aspectRatio = 4 / 5,
  touch = false,
  className,
  imageClassName,
}: ImageTrailProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<Slot[]>([]);
  const sources = images.map((image) => toImage(image).src);
  const sourcesKey = sources.join("\n");
  const poolSize = Math.max(1, Math.min(maxVisible, 24));
  const enabled = !reduceMotion && sources.length > 0;

  // Warm the cache so the first pass over the list does not pop in late.
  useEffect(() => {
    if (!enabled) return;
    for (const src of sourcesKey.split("\n")) {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    }
  }, [enabled, sourcesKey]);

  const settingsRef = useRef({ variant, threshold, duration, imageSize, aspectRatio, touch, sources, poolSize });
  useEffect(() => {
    settingsRef.current = { variant, threshold, duration, imageSize, aspectRatio, touch, sources, poolSize };
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    let last: { x: number; y: number } | null = null;
    let next = 0;
    let layer = 1;

    const spawn = (x: number, y: number, dx: number, dy: number) => {
      const settings = settingsRef.current;
      const slot = slotsRef.current[next % settings.poolSize];
      const element = slot?.element;
      if (!element) return;
      const src = settings.sources[next % settings.sources.length];
      next += 1;
      if (element.getAttribute("src") !== src) element.setAttribute("src", src);

      const width = settings.imageSize;
      const height = width / settings.aspectRatio;
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      element.style.zIndex = String(layer++);

      let rotate = 0;
      let offsetX = 0;
      let offsetY = 0;
      let driftX = 0;
      let driftY = 0;
      if (settings.variant === "scatter") {
        rotate = (Math.random() - 0.5) * 22;
        offsetX = (Math.random() - 0.5) * 28;
        offsetY = (Math.random() - 0.5) * 28;
      } else if (settings.variant === "stack") {
        rotate = (next % 2 === 0 ? 1 : -1) * (3 + Math.random() * 3);
        // Each card slides a little further along the direction of travel.
        const length = Math.hypot(dx, dy) || 1;
        driftX = (dx / length) * 18;
        driftY = (dy / length) * 18;
      }
      const left = x - width / 2 + offsetX;
      const top = y - height / 2 + offsetY;
      const at = (scale: number, extraRotate = 0, moveX = 0, moveY = 0) =>
        `translate3d(${left + moveX}px, ${top + moveY}px, 0) rotate(${rotate + extraRotate}deg) scale(${scale})`;

      slot.animation?.cancel();
      const entry = settings.variant === "fade" ? 0.92 : 0.6;
      slot.animation = element.animate(
        [
          { opacity: 0, transform: at(entry, settings.variant === "scatter" ? -rotate * 0.4 : 0), offset: 0 },
          { opacity: 1, transform: at(1), offset: 0.16 },
          { opacity: 1, transform: at(1, 0, driftX * 0.7, driftY * 0.7), offset: 0.72 },
          { opacity: 0, transform: at(settings.variant === "fade" ? 1 : 0.86, 0, driftX, driftY), offset: 1 },
        ],
        { duration: settings.duration, easing: EASE_OUT_CSS, fill: "forwards" },
      );
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" && !settingsRef.current.touch) return;
      const rect = root.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (!last) {
        last = { x, y };
        return;
      }
      const dx = x - last.x;
      const dy = y - last.y;
      if (Math.hypot(dx, dy) < settingsRef.current.threshold) return;
      spawn(x, y, dx, dy);
      last = { x, y };
    };
    const onLeave = () => {
      last = null;
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave, { passive: true });
    const slots = slotsRef.current;
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      for (const slot of slots) slot.animation?.cancel();
    };
  }, [enabled]);

  return (
    <div
      ref={rootRef}
      data-slot="image-trail"
      className={cn("relative isolate overflow-hidden", touch && enabled && "touch-none", className)}
    >
      {enabled ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          {Array.from({ length: poolSize }, (_, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- pooled decorative images animated directly
            <img
              key={index}
              ref={(element) => {
                slotsRef.current[index] = { element, animation: slotsRef.current[index]?.animation ?? null };
              }}
              alt=""
              draggable={false}
              decoding="async"
              className={cn(
                "absolute top-0 left-0 rounded-xl object-cover opacity-0 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.45)] ring-1 ring-black/5 will-change-transform select-none dark:ring-white/10",
                imageClassName,
              )}
              style={{ transformOrigin: "center" } as CSSProperties}
            />
          ))}
        </div>
      ) : null}
      <div className="relative z-10 size-full">
        {children}
      </div>
    </div>
  );
}
