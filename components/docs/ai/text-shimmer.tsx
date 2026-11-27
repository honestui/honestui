import { cn } from "@/lib/utils";
import type { ComponentType, CSSProperties, ElementType, ReactNode } from "react";

export interface TextShimmerProps {
  children: ReactNode;
  as?: ElementType;
  duration?: number;
  className?: string;
}

type TextShimmerRootProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function TextShimmer({ children, as: Comp = "span", duration = 2.5, className }: TextShimmerProps) {
  const Root = Comp as ComponentType<TextShimmerRootProps>;

  return (
    <>
      {/* href and precedence let React hoist this once, however many shimmers render. */}
      <style href="beui-text-shimmer" precedence="default">
        {`@keyframes beui-text-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}@media(prefers-reduced-motion:reduce){.beui-text-shimmer{animation:none!important;background:none!important;color:var(--hui-color-foreground-base-secondary)!important}}`}
      </style>
      <Root
        style={{ animation: `beui-text-shimmer ${duration}s linear infinite` }}
        className={cn(
          "beui-text-shimmer",
          "inline-block bg-[length:200%_100%] bg-clip-text text-transparent",
          "bg-[linear-gradient(110deg,var(--hui-color-foreground-base-secondary)_30%,var(--hui-color-foreground-base-primary)_50%,var(--hui-color-foreground-base-secondary)_70%)]",
          className,
        )}
      >
        {children}
      </Root>
    </>
  );
}
