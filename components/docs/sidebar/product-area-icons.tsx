import { useId } from "react";

/**
 * Illustrated marks for the Library switcher. They share one construction:
 * a 32-unit grid, one gradient-filled hero shape, and supporting shapes in
 * the same hue at reduced opacity. Colors are fixed per mark, so the row's
 * text color cannot repaint them.
 */

export interface ProductAreaIconProps {
  className?: string;
}

interface Palette {
  from: string;
  to: string;
}

function useGradient({ from, to }: Palette) {
  const id = useId();

  return {
    paint: `url(#${id})`,
    def: (
      <linearGradient
        id={id}
        gradientUnits="userSpaceOnUse"
        x1="4"
        y1="2"
        x2="28"
        y2="30"
      >
        <stop style={{ stopColor: from }} />
        <stop offset="1" style={{ stopColor: to }} />
      </linearGradient>
    ),
  };
}

function Mark({
  className,
  children,
}: ProductAreaIconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

const COMPONENTS: Palette = { from: "#FF9076", to: "#E43861" };

export function ComponentsAreaIcon({ className }: ProductAreaIconProps) {
  const gradient = useGradient(COMPONENTS);

  return (
    <Mark className={className}>
      <defs>{gradient.def}</defs>
      <rect x="3" y="4" width="26" height="11" rx="4.5" fill={gradient.paint} />
      <rect x="8" y="8.25" width="10" height="2.5" rx="1.25" fill="#fff" fillOpacity="0.85" />
      <rect x="3" y="17.5" width="11.5" height="11.5" rx="4" fill={COMPONENTS.to} fillOpacity="0.5" />
      <circle cx="23" cy="23.25" r="5.75" fill={COMPONENTS.to} fillOpacity="0.28" />
    </Mark>
  );
}

const PRODUCT_ACCENT = "var(--hui-color-foreground-accent-primary)";
const PRODUCT: Palette = {
  from: `color-mix(in oklab, ${PRODUCT_ACCENT} 50%, white)`,
  to: PRODUCT_ACCENT,
};

export function ProductAreaIcon({ className }: ProductAreaIconProps) {
  const gradient = useGradient(PRODUCT);
  const layer = "M16 4.5 27 10.25 16 16 5 10.25Z";

  return (
    <Mark className={className}>
      <defs>{gradient.def}</defs>
      <g strokeWidth="3" strokeLinejoin="round">
        <path
          d={layer}
          transform="translate(0 11.5)"
          style={{ fill: PRODUCT.to, stroke: PRODUCT.to }}
          opacity="0.25"
        />
        <path
          d={layer}
          transform="translate(0 5.75)"
          style={{ fill: PRODUCT.to, stroke: PRODUCT.to }}
          opacity="0.5"
        />
        <path d={layer} fill={gradient.paint} stroke={gradient.paint} />
      </g>
    </Mark>
  );
}

const CHARTS: Palette = { from: "#4ADEDE", to: "#0EA5E9" };

export function ChartsAreaIcon({ className }: ProductAreaIconProps) {
  const gradient = useGradient(CHARTS);
  const fadeId = useId();
  const line = "M4 22.5C7.5 22.5 8.5 13 12.5 13S17 19.5 20.5 19.5 23.5 8.5 26.5 7";

  return (
    <Mark className={className}>
      <defs>
        {gradient.def}
        <linearGradient id={fadeId} x1="0" y1="7" x2="0" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor={CHARTS.to} stopOpacity="0.5" />
          <stop offset="1" stopColor={CHARTS.to} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={`${line}V25a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z`} fill={`url(#${fadeId})`} />
      <path d={line} stroke={gradient.paint} strokeWidth="3" strokeLinecap="round" />
      <circle cx="26.5" cy="7" r="3.5" fill={CHARTS.to} />
      <circle cx="26.5" cy="7" r="1.4" fill="#fff" />
    </Mark>
  );
}

const ICONS: Palette = { from: "#FFD43B", to: "#F59E0B" };

export function IconsAreaIcon({ className }: ProductAreaIconProps) {
  const gradient = useGradient(ICONS);

  return (
    <Mark className={className}>
      <defs>{gradient.def}</defs>
      <rect x="11" y="3" width="18" height="18" rx="5.5" fill={ICONS.to} fillOpacity="0.32" />
      <rect x="3" y="11" width="18" height="18" rx="5.5" fill={gradient.paint} />
      <path
        d="M12 14.25c.6 3.3 2.45 5.15 5.75 5.75-3.3.6-5.15 2.45-5.75 5.75-.6-3.3-2.45-5.15-5.75-5.75 3.3-.6 5.15-2.45 5.75-5.75Z"
        fill="#fff"
        fillOpacity="0.92"
      />
      <path
        d="M24 6.5c.3 1.6 1.15 2.45 2.75 2.75-1.6.3-2.45 1.15-2.75 2.75-.3-1.6-1.15-2.45-2.75-2.75 1.6-.3 2.45-1.15 2.75-2.75Z"
        fill={ICONS.to}
      />
    </Mark>
  );
}

const ANIMATED: Palette = { from: "#86E36B", to: "#10B981" };

export function AnimatedAreaIcon({ className }: ProductAreaIconProps) {
  const gradient = useGradient(ANIMATED);
  const play = "M16 8.5 27 16 16 23.5Z";

  return (
    <Mark className={className}>
      <defs>{gradient.def}</defs>
      <g strokeWidth="3.5" strokeLinejoin="round">
        <path
          d={play}
          transform="translate(-11 0)"
          fill={ANIMATED.to}
          stroke={ANIMATED.to}
          opacity="0.2"
        />
        <path
          d={play}
          transform="translate(-5.5 0)"
          fill={ANIMATED.to}
          stroke={ANIMATED.to}
          opacity="0.45"
        />
        <path d={play} fill={gradient.paint} stroke={gradient.paint} />
      </g>
    </Mark>
  );
}

const SHADERS: Palette = { from: "#FF7EB6", to: "#7C3AED" };

export function ShadersAreaIcon({ className }: ProductAreaIconProps) {
  const gradient = useGradient(SHADERS);
  const clipId = useId();

  return (
    <Mark className={className}>
      <defs>
        {gradient.def}
        <clipPath id={clipId}>
          <circle cx="16" cy="16" r="13" />
        </clipPath>
      </defs>
      <circle cx="16" cy="16" r="13" fill={gradient.paint} />
      <g clipPath={`url(#${clipId})`} fill="#fff">
        <path
          d="M1 13c4 0 4-4 8-4s4 4 8 4 4-4 8-4 4 4 8 4v6c-4 0-4-4-8-4s-4 4-8 4-4-4-8-4-4 4-8 4Z"
          fillOpacity="0.38"
        />
        <path
          d="M1 21c4 0 4-4 8-4s4 4 8 4 4-4 8-4 4 4 8 4v10H1Z"
          fillOpacity="0.2"
        />
      </g>
    </Mark>
  );
}

const EXAMPLES: Palette = { from: "#B197FC", to: "#6366F1" };

export function ExamplesAreaIcon({ className }: ProductAreaIconProps) {
  const gradient = useGradient(EXAMPLES);

  return (
    <Mark className={className}>
      <defs>{gradient.def}</defs>
      <rect x="2" y="4" width="28" height="24" rx="6.5" fill={EXAMPLES.to} fillOpacity="0.26" />
      <rect x="5.5" y="7.5" width="21" height="5" rx="2.5" fill={gradient.paint} />
      <rect x="5.5" y="15" width="7.5" height="9.5" rx="2.75" fill={gradient.paint} />
      <rect x="15.5" y="15" width="11" height="9.5" rx="2.75" fill={EXAMPLES.to} fillOpacity="0.55" />
    </Mark>
  );
}
