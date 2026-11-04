import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex w-fit shrink-0 cursor-pointer items-center justify-center gap-[var(--hui-space-3)] whitespace-nowrap rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-density-control-padding-inline,var(--hui-space-4))] py-[calc(var(--hui-density-control-padding-block,var(--hui-space-3))-1px)] [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)] outline-none forced-colors:border forced-colors:border-[ButtonText] forced-colors:disabled:border-[GrayText] motion-safe:[transition:var(--hui-transition-interactive)] motion-safe:active:[transition:var(--hui-transition-pressed)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)] motion-safe:not-disabled:active:scale-[var(--hui-scale-pressed)] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:text-[var(--hui-color-foreground-base-tertiary)] disabled:shadow-none pointer-coarse:after:pointer-events-none pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--hui-color-background-accent-emphasis)] text-[var(--hui-color-foreground-accent-emphasis)] shadow-[var(--hui-shadow-key,var(--hui-shadow-feather))] not-disabled:hover:bg-[var(--hui-color-background-accent-emphasis-hover)] not-disabled:active:bg-[var(--hui-color-background-accent-emphasis-hover)] disabled:bg-[var(--hui-color-background-neutral-secondary)]",
        outline:
          "border-[0.5px] border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)] not-disabled:hover:border-[var(--hui-color-border-base-focus)] not-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] not-disabled:active:bg-[var(--hui-color-background-base-primary-hover)] disabled:border-[var(--hui-color-border-base-primary)] disabled:bg-transparent data-popup-open:bg-[var(--hui-color-background-base-primary-hover)]",
        secondary:
          "bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-key,var(--hui-shadow-feather))] not-disabled:hover:bg-[var(--hui-color-background-neutral-secondary-hover)] not-disabled:active:bg-[var(--hui-color-background-neutral-secondary-hover)] data-popup-open:bg-[var(--hui-color-background-neutral-secondary-hover)]",
        // The danger fill is darkened 10% so white 13px label text reaches 4.5:1 (it is 3.9:1 on the raw token).
        destructive:
          "bg-[color-mix(in_oklch,var(--hui-color-background-danger-emphasis)_90%,black)] text-[var(--hui-color-foreground-danger-emphasis)] shadow-[var(--hui-shadow-key,var(--hui-shadow-feather))] not-disabled:hover:bg-[color-mix(in_oklch,var(--hui-color-background-danger-emphasis)_80%,black)] not-disabled:active:bg-[color-mix(in_oklch,var(--hui-color-background-danger-emphasis)_80%,black)] focus-visible:[outline-color:var(--hui-color-border-danger-emphasis)] disabled:bg-[var(--hui-color-background-neutral-secondary)]",
        "destructive-outline":
          "border-[0.5px] border-[var(--hui-color-border-danger-emphasis)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-danger-primary)] shadow-[var(--hui-shadow-feather)] not-disabled:hover:border-[var(--hui-color-border-danger-emphasis-hover)] not-disabled:hover:bg-[var(--hui-color-background-danger-primary)] not-disabled:active:border-[var(--hui-color-border-danger-emphasis-hover)] not-disabled:active:bg-[var(--hui-color-background-danger-primary)] focus-visible:[outline-color:var(--hui-color-border-danger-emphasis)] disabled:border-[var(--hui-color-border-base-primary)] disabled:bg-transparent data-popup-open:bg-[var(--hui-color-background-danger-primary)]",
        ghost:
          "border-[0.5px] border-[var(--hui-color-border-ghost,var(--hui-color-border-base-primary))] text-[var(--hui-color-foreground-base-primary)] not-disabled:hover:border-[var(--hui-color-border-ghost-hover,var(--hui-color-border-base-secondary))] not-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] not-disabled:active:bg-[var(--hui-color-background-neutral-secondary)] data-popup-open:bg-[var(--hui-color-background-base-primary-hover)]",
        link: "text-[var(--hui-color-foreground-base-primary)] not-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] not-disabled:active:bg-[var(--hui-color-background-neutral-secondary)] data-popup-open:bg-[var(--hui-color-background-base-primary-hover)]",
      },
      size: {
        default:
          "min-h-[var(--hui-density-control-height,36px)] px-[var(--hui-density-control-padding-inline,var(--hui-space-4))] py-[calc(var(--hui-density-control-padding-block,var(--hui-space-3))-1px)] [font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)]",
        xs: "min-h-6 gap-[var(--hui-space-2)] rounded-[var(--hui-radius-1)] px-[var(--hui-space-2)] py-[var(--hui-space-1)] [font-size:var(--hui-font-size-control-xs,var(--hui-font-size-micro))] [letter-spacing:var(--hui-letter-spacing-micro)] [line-height:var(--hui-line-height-control-xs,var(--hui-line-height-micro))] [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-[var(--hui-control-height-sm,var(--hui-space-8))] gap-[var(--hui-space-2)] px-[var(--hui-space-3)] py-[var(--hui-space-1)] [font-size:var(--hui-font-size-control-sm,var(--hui-font-size-mini))] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-control-sm,var(--hui-line-height-mini))]",
        lg: "min-h-[var(--hui-control-height-lg,44px)] px-[var(--hui-space-5)] py-[calc(var(--hui-space-3)-1px)] [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]",
        xl: "min-h-[var(--hui-space-11)] px-[var(--hui-space-6)] py-[var(--hui-space-4)] [font-size:var(--hui-font-size-large)] [letter-spacing:var(--hui-letter-spacing-large)] [line-height:var(--hui-line-height-large)] [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-[var(--hui-density-control-height,36px)] p-0",
        "icon-sm": "size-[var(--hui-control-height-sm,var(--hui-space-8))] p-0",
        "icon-lg": "size-[var(--hui-control-height-lg,44px)] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  asChild?: boolean
}

function Button({
  className,
  variant,
  size,
  render,
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const renderValue = asChild
    ? (React.Children.only(children) as React.ReactElement<
        Record<string, unknown>
      >)
    : render

  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    renderValue ? undefined : "button"

  const defaultProps = {
    "data-slot": "button",
    className: cn(buttonVariants({ variant, size, className })),
    type: typeValue,
  }

  return useRender({
    defaultTagName: "button",
    render: renderValue,
    props: mergeProps<"button">(
      defaultProps,
      asChild ? props : { ...props, children }
    ),
  })
}

export { Button, buttonVariants }
