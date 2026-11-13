import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Marks for the Library switcher. Every mark is a bare 20px glyph drawn on a
 * 20-unit grid with a 2-unit margin, with no tile behind it: the silhouette
 * is what tells one area from the next, and a shared tile would flatten the
 * seven into one shape. Glyphs are flat and two-tone — `currentColor` at full
 * strength for the hero shape and at `SOFT` for supporting shapes — so the
 * set reads as one family and follows the theme. Selection never changes the
 * mark: the row's check carries that.
 */

export interface ProductAreaIconProps {
  className?: string;
}

const SOFT = 0.4;

function Mark({
  className,
  children,
}: ProductAreaIconProps & { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center text-[var(--hui-color-foreground-base-primary)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        className="size-5! text-inherit!"
      >
        {children}
      </svg>
    </span>
  );
}

/** Four primitives on a 2×2 grid. */
export function ComponentsAreaIcon(props: ProductAreaIconProps) {
  return (
    <Mark {...props}>
      <rect x="2" y="2" width="7.25" height="7.25" rx="2.25" fill="currentColor" />
      <circle cx="14.375" cy="5.625" r="3.625" fill="currentColor" fillOpacity={SOFT} />
      <circle cx="5.625" cy="14.375" r="3.625" fill="currentColor" fillOpacity={SOFT} />
      <rect x="10.75" y="10.75" width="7.25" height="7.25" rx="2.25" fill="currentColor" />
    </Mark>
  );
}

/** Primitives composed into layers. */
export function ProductAreaIcon(props: ProductAreaIconProps) {
  return (
    <Mark {...props}>
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 3 17 6.75 10 10.5 3 6.75Z" fill="currentColor" />
        <path d="M3 10.25 10 14 17 10.25" strokeOpacity={SOFT + 0.2} />
        <path d="M3 13.5 10 17.25 17 13.5" strokeOpacity={SOFT - 0.1} />
      </g>
    </Mark>
  );
}

/** A series ending on its latest point, over the area it encloses. */
export function ChartsAreaIcon(props: ProductAreaIconProps) {
  return (
    <Mark {...props}>
      <path
        d="M2.75 12.75C5 12.75 5.25 7.5 7.75 7.5s2.75 4 5 4 2.25-5.5 3.5-6.25V16a1.25 1.25 0 0 1-1.25 1.25H4A1.25 1.25 0 0 1 2.75 16Z"
        fill="currentColor"
        fillOpacity={SOFT}
      />
      <path
        d="M2.75 12.75C5 12.75 5.25 7.5 7.75 7.5s2.75 4 5 4 2.25-5.5 3.5-6.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="16" cy="5" r="2" fill="currentColor" />
    </Mark>
  );
}

/** A glyph and a smaller sibling. */
export function IconsAreaIcon(props: ProductAreaIconProps) {
  return (
    <Mark {...props}>
      <path
        d="M8.5 5.5c.65 3.55 2.45 5.35 6 6-3.55.65-5.35 2.45-6 6-.65-3.55-2.45-5.35-6-6 3.55-.65 5.35-2.45 6-6Z"
        fill="currentColor"
      />
      <path
        d="M15 2.25c.3 1.65 1.1 2.45 2.75 2.75C16.1 5.3 15.3 6.1 15 7.75c-.3-1.65-1.1-2.45-2.75-2.75C13.9 4.7 14.7 3.9 15 2.25Z"
        fill="currentColor"
        fillOpacity={SOFT + 0.1}
      />
    </Mark>
  );
}

/** A play head leaving a motion trail. */
export function AnimatedAreaIcon(props: ProductAreaIconProps) {
  return (
    <Mark {...props}>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v6" strokeWidth="2" strokeOpacity={SOFT - 0.1} />
        <path d="M6.75 5v10" strokeWidth="2" strokeOpacity={SOFT + 0.2} />
        <path d="M10.75 4.5 17.25 10 10.75 15.5Z" strokeWidth="1.5" fill="currentColor" />
      </g>
    </Mark>
  );
}

/** A shaded sphere: a lit face over its own shadow. */
export function ShadersAreaIcon(props: ProductAreaIconProps) {
  const clipId = useId();

  return (
    <Mark {...props}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="10" cy="10" r="7.5" />
        </clipPath>
      </defs>
      <circle cx="10" cy="10" r="7.5" fill="currentColor" fillOpacity={SOFT} />
      <circle cx="7.25" cy="7.25" r="7" fill="currentColor" clipPath={`url(#${clipId})`} />
    </Mark>
  );
}

/** A finished screen: a window with its header and navigation rail. */
export function ExamplesAreaIcon(props: ProductAreaIconProps) {
  return (
    <Mark {...props}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="3" fill="currentColor" fillOpacity={SOFT} />
      <path d="M2.5 6.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3V8h-15Z" fill="currentColor" />
      <rect x="4.5" y="10" width="3" height="4.5" rx="1" fill="currentColor" />
    </Mark>
  );
}
