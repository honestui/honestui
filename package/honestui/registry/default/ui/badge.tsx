import { mergeProps } from "@base-ui-components/react/merge-props"
import { useRender } from "@base-ui-components/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-[var(--hui-space-2)] whitespace-nowrap rounded-[var(--hui-radius-1)] border-0 px-[var(--hui-space-2)] py-[var(--hui-space-1)] [font-style:normal] [font-weight:var(--hui-font-weight-regular)] outline-none focus-visible:[outline:var(--hui-focus-ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-[var(--hui-color-foreground-base-primary)] [button,a&]:cursor-pointer [button,a&]:pointer-coarse:after:absolute [button,a&]:pointer-coarse:after:size-full [button,a&]:pointer-coarse:after:min-h-11 [button,a&]:pointer-coarse:after:min-w-11",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--hui-color-background-accent-primary)] text-[var(--hui-color-foreground-base-primary)]",
        destructive:
          "bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-color-foreground-base-primary)]",
        outline:
          "border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-transparent text-[var(--hui-color-foreground-base-primary)]",
        secondary:
          "bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-primary)]",
        info: "bg-[var(--hui-color-background-accent-primary)] text-[var(--hui-color-foreground-base-primary)]",
        success:
          "bg-[var(--hui-color-background-success-primary)] text-[var(--hui-color-foreground-base-primary)]",
        warning:
          "bg-[var(--hui-color-background-attention-primary)] text-[var(--hui-color-foreground-base-primary)]",
        error:
          "bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-color-foreground-base-primary)]",
        neutral:
          "bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-primary)]",
        accent:
          "bg-[var(--hui-color-background-accent-primary)] text-[var(--hui-color-foreground-base-primary)]",
        danger:
          "bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-color-foreground-base-primary)]",
        gradient:
          "bg-[linear-gradient(to_right,oklch(0.5674_0.2831_312.58_/_0.2)_0%,oklch(0.5988_0.2445_29.12_/_0.2)_100%)] text-[var(--hui-color-foreground-base-primary)]",
      },
      size: {
        default:
          "h-[22px] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] [&_svg:not([class*='size-'])]:size-[var(--hui-space-4)]",
        sm: "h-[18px] [font-size:var(--hui-font-size-micro)] [letter-spacing:var(--hui-letter-spacing-micro)] [line-height:var(--hui-line-height-micro)] [&_svg:not([class*='size-'])]:size-[10px]",
        lg: "h-[var(--hui-space-8)] [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)] [&_svg:not([class*='size-'])]:size-[14px]",
        micro:
          "h-[18px] [font-size:var(--hui-font-size-micro)] [letter-spacing:var(--hui-letter-spacing-micro)] [line-height:var(--hui-line-height-micro)] [&_svg:not([class*='size-'])]:size-[10px]",
        small:
          "h-[22px] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] [&_svg:not([class*='size-'])]:size-[var(--hui-space-4)]",
        regular:
          "h-[var(--hui-space-8)] [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)] [&_svg:not([class*='size-'])]:size-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface BadgeProps extends useRender.ComponentProps<"span"> {
  variant?: VariantProps<typeof badgeVariants>["variant"]
  size?: VariantProps<typeof badgeVariants>["size"]
}

function Badge({ className, variant, size, render, ...props }: BadgeProps) {
  const defaultProps = {
    "data-slot": "badge",
    className: cn(badgeVariants({ variant, size, className })),
  }

  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(defaultProps, props),
  })
}

export { Badge, badgeVariants }
