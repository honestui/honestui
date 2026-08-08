import { mergeProps } from "@base-ui-components/react/merge-props"
import { useRender } from "@base-ui-components/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-[var(--rs-space-2)] whitespace-nowrap rounded-[var(--rs-radius-1)] border-0 px-[var(--rs-space-2)] py-[var(--rs-space-1)] [font-style:normal] [font-weight:var(--rs-font-weight-regular)] outline-none focus-visible:[outline:var(--rs-focus-ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-[var(--rs-color-foreground-base-primary)] [button,a&]:cursor-pointer [button,a&]:pointer-coarse:after:absolute [button,a&]:pointer-coarse:after:size-full [button,a&]:pointer-coarse:after:min-h-11 [button,a&]:pointer-coarse:after:min-w-11",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--rs-color-background-accent-primary)] text-[var(--rs-color-foreground-base-primary)]",
        destructive:
          "bg-[var(--rs-color-background-danger-primary)] text-[var(--rs-color-foreground-base-primary)]",
        outline:
          "border-[0.5px] border-[var(--rs-color-border-base-primary)] bg-transparent text-[var(--rs-color-foreground-base-primary)]",
        secondary:
          "bg-[var(--rs-color-background-neutral-secondary)] text-[var(--rs-color-foreground-base-primary)]",
        info: "bg-[var(--rs-color-background-accent-primary)] text-[var(--rs-color-foreground-base-primary)]",
        success:
          "bg-[var(--rs-color-background-success-primary)] text-[var(--rs-color-foreground-base-primary)]",
        warning:
          "bg-[var(--rs-color-background-attention-primary)] text-[var(--rs-color-foreground-base-primary)]",
        error:
          "bg-[var(--rs-color-background-danger-primary)] text-[var(--rs-color-foreground-base-primary)]",
        neutral:
          "bg-[var(--rs-color-background-neutral-secondary)] text-[var(--rs-color-foreground-base-primary)]",
        accent:
          "bg-[var(--rs-color-background-accent-primary)] text-[var(--rs-color-foreground-base-primary)]",
        danger:
          "bg-[var(--rs-color-background-danger-primary)] text-[var(--rs-color-foreground-base-primary)]",
        gradient:
          "bg-[linear-gradient(to_right,oklch(0.5674_0.2831_312.58_/_0.2)_0%,oklch(0.5988_0.2445_29.12_/_0.2)_100%)] text-[var(--rs-color-foreground-base-primary)]",
      },
      size: {
        default:
          "h-[22px] [font-size:var(--rs-font-size-small)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] [&_svg:not([class*='size-'])]:size-[var(--rs-space-4)]",
        sm: "h-[18px] [font-size:var(--rs-font-size-micro)] [letter-spacing:var(--rs-letter-spacing-micro)] [line-height:var(--rs-line-height-micro)] [&_svg:not([class*='size-'])]:size-[10px]",
        lg: "h-[var(--rs-space-8)] [font-size:var(--rs-font-size-regular)] [letter-spacing:var(--rs-letter-spacing-regular)] [line-height:var(--rs-line-height-regular)] [&_svg:not([class*='size-'])]:size-[14px]",
        micro:
          "h-[18px] [font-size:var(--rs-font-size-micro)] [letter-spacing:var(--rs-letter-spacing-micro)] [line-height:var(--rs-line-height-micro)] [&_svg:not([class*='size-'])]:size-[10px]",
        small:
          "h-[22px] [font-size:var(--rs-font-size-small)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] [&_svg:not([class*='size-'])]:size-[var(--rs-space-4)]",
        regular:
          "h-[var(--rs-space-8)] [font-size:var(--rs-font-size-regular)] [letter-spacing:var(--rs-letter-spacing-regular)] [line-height:var(--rs-line-height-regular)] [&_svg:not([class*='size-'])]:size-[14px]",
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
