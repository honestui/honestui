import { Children, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface OrbitingCirclesProps {
  /** Items placed on the orbit, spaced evenly around it. */
  children: ReactNode;
  /** Orbit radius, in px. */
  radius?: number;
  /** Seconds for one full revolution. */
  duration?: number;
  /** Orbit counterclockwise. */
  reverse?: boolean;
  /** Draw the orbit as a faint ring. */
  path?: boolean;
  /** Width and height of each item slot, in px. */
  iconSize?: number;
  /** Rotation of the first item at rest, in degrees. */
  startAngle?: number;
  /** Classes for the orbit ring. */
  pathClassName?: string;
  className?: string;
}

/**
 * Places its children on a circle and turns them around the center. Render it
 * inside a `relative` box; the orbit is centered in that box, so several
 * OrbitingCircles with different radii make concentric rings. Items stay
 * upright as they travel.
 */
export function OrbitingCircles({
  children,
  radius = 120,
  duration = 24,
  reverse = false,
  path = true,
  iconSize = 32,
  startAngle = -90,
  pathClassName,
  className,
}: OrbitingCirclesProps) {
  const items = Children.toArray(children);
  const count = Math.max(items.length, 1);

  return (
    <>
      <style>
        {`@keyframes beui-orbit{from{transform:rotate(var(--orbit-angle)) translateX(var(--orbit-radius)) rotate(calc(var(--orbit-angle) * -1))}to{transform:rotate(calc(var(--orbit-angle) + 360deg)) translateX(var(--orbit-radius)) rotate(calc(var(--orbit-angle) * -1 - 360deg))}}.beui-orbit{transform:rotate(var(--orbit-angle)) translateX(var(--orbit-radius)) rotate(calc(var(--orbit-angle) * -1));animation:beui-orbit var(--orbit-duration) linear infinite;animation-direction:var(--orbit-direction)}@media(prefers-reduced-motion:reduce){.beui-orbit{animation:none}}`}
      </style>
      <div
        className={cn("pointer-events-none absolute inset-0 flex items-center justify-center", className)}
      >
        {path ? (
          <div
            aria-hidden
            className={cn("absolute rounded-full border border-border", pathClassName)}
            style={{ width: radius * 2, height: radius * 2 }}
          />
        ) : null}
        {items.map((child, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: orbit slots are positional and never reordered.
            key={index}
            className="beui-orbit pointer-events-auto absolute flex items-center justify-center"
            style={
              {
                width: iconSize,
                height: iconSize,
                "--orbit-angle": `${startAngle + (360 / count) * index}deg`,
                "--orbit-radius": `${radius}px`,
                "--orbit-duration": `${duration}s`,
                "--orbit-direction": reverse ? "reverse" : "normal",
              } as CSSProperties
            }
          >
            {child}
          </div>
        ))}
      </div>
    </>
  );
}
