import { Separator as SeparatorPrimitive } from "@base-ui-components/react/separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  size = "full",
  variant = "primary",
  ...props
}: SeparatorPrimitive.Props & {
  size?: "small" | "half" | "full"
  variant?: "primary" | "secondary" | "tertiary"
}) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      data-size={size}
      data-variant={variant}
      orientation={orientation}
      className={cn(
        "m-0 shrink-0 cursor-default border-0",
        variant === "primary" &&
          "bg-[var(--hui-color-border-base-primary)]",
        variant === "secondary" &&
          "bg-[var(--hui-color-border-base-secondary)]",
        variant === "tertiary" &&
          "bg-[var(--hui-color-border-base-tertiary)]",
        size === "small" &&
          "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-[var(--hui-space-6)] data-[orientation=vertical]:h-[var(--hui-space-6)] data-[orientation=vertical]:w-px",
        size === "half" &&
          "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-1/2 data-[orientation=vertical]:h-1/2 data-[orientation=vertical]:w-px",
        size === "full" &&
          "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
