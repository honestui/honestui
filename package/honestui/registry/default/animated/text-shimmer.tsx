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
      <style>
        {`@keyframes beui-text-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}@media(prefers-reduced-motion:reduce){.beui-text-shimmer{animation:none!important;background-position:50% 0}}`}
      </style>
      <Root
        style={{ animation: `beui-text-shimmer ${duration}s linear infinite` }}
        className={cn(
          "beui-text-shimmer",
          "inline-block bg-[length:200%_100%] bg-clip-text text-transparent",
          "bg-[linear-gradient(110deg,var(--muted-foreground)_30%,var(--foreground)_50%,var(--muted-foreground)_70%)]",
          className,
        )}
      >
        {children}
      </Root>
    </>
  );
}
