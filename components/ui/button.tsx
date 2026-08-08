import * as React from "react"
import { mergeProps } from "@base-ui-components/react/merge-props"
import { useRender } from "@base-ui-components/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex w-fit shrink-0 cursor-pointer items-center justify-center gap-[var(--rs-space-3)] whitespace-nowrap rounded-[var(--rs-radius-2)] border-0 bg-transparent px-[var(--rs-space-4)] py-[var(--rs-space-3)] [font-size:var(--rs-font-size-small)] [font-weight:var(--rs-font-weight-medium)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] outline-none motion-safe:[transition:var(--rs-transition-interactive)] motion-safe:active:[transition:var(--rs-transition-pressed)] focus-visible:[outline:var(--rs-focus-ring)] not-disabled:active:scale-[var(--rs-scale-pressed)] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:after:pointer-events-none pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--rs-color-background-accent-emphasis)] text-[var(--rs-color-foreground-accent-emphasis)] shadow-[var(--rs-shadow-feather)] hover:bg-[var(--rs-color-background-accent-emphasis-hover)] active:bg-[var(--rs-color-background-accent-emphasis-hover)] focus-visible:outline-offset-[var(--rs-focus-ring-offset-accent)] disabled:hover:bg-[var(--rs-color-background-accent-emphasis)]",
        outline:
          "border-[0.5px] border-[var(--rs-color-border-accent-emphasis)] bg-[var(--rs-color-background-base-primary)] text-[var(--rs-color-foreground-accent-primary)] shadow-[var(--rs-shadow-feather)] hover:bg-[var(--rs-color-background-accent-primary)] active:bg-[var(--rs-color-background-accent-primary)] disabled:bg-transparent disabled:hover:border-[var(--rs-color-border-accent-emphasis)] disabled:hover:bg-transparent disabled:hover:text-[var(--rs-color-foreground-accent-primary)]",
        secondary:
          "bg-[var(--rs-color-background-neutral-secondary)] text-[var(--rs-color-foreground-base-primary)] shadow-[var(--rs-shadow-feather)] hover:bg-[var(--rs-color-background-neutral-secondary-hover)] active:bg-[var(--rs-color-background-neutral-secondary-hover)] disabled:hover:bg-[var(--rs-color-background-neutral-secondary)] disabled:hover:text-[var(--rs-color-foreground-base-primary)]",
        destructive:
          "bg-[var(--rs-color-background-danger-emphasis)] text-[var(--rs-color-foreground-danger-emphasis)] shadow-[var(--rs-shadow-feather)] hover:bg-[var(--rs-color-background-danger-emphasis-hover)] active:bg-[var(--rs-color-background-danger-emphasis-hover)] focus-visible:[outline-color:var(--rs-color-border-danger-emphasis)] focus-visible:outline-offset-[var(--rs-focus-ring-offset-accent)] disabled:hover:bg-[var(--rs-color-background-danger-emphasis)]",
        "destructive-outline":
          "border-[0.5px] border-[var(--rs-color-border-danger-emphasis)] bg-[var(--rs-color-background-base-primary)] text-[var(--rs-color-foreground-danger-primary)] shadow-[var(--rs-shadow-feather)] hover:border-[var(--rs-color-border-danger-emphasis-hover)] hover:bg-[var(--rs-color-background-danger-primary)] active:border-[var(--rs-color-border-danger-emphasis-hover)] active:bg-[var(--rs-color-background-danger-primary)] focus-visible:[outline-color:var(--rs-color-border-danger-emphasis)] disabled:bg-transparent disabled:hover:border-[var(--rs-color-border-danger-emphasis)] disabled:hover:bg-transparent disabled:hover:text-[var(--rs-color-foreground-danger-primary)]",
        ghost:
          "border border-dashed border-[var(--rs-color-border-base-primary)] text-[var(--rs-color-foreground-base-primary)] hover:bg-[var(--rs-color-background-base-primary-hover)] active:bg-[var(--rs-color-background-base-primary-hover)] disabled:hover:border-[var(--rs-color-border-base-primary)] disabled:hover:bg-transparent disabled:hover:text-[var(--rs-color-foreground-base-primary)]",
        link: "text-[var(--rs-color-foreground-base-primary)] hover:bg-[var(--rs-color-background-base-primary-hover)] active:bg-[var(--rs-color-background-base-primary-hover)] disabled:hover:bg-transparent disabled:hover:text-[var(--rs-color-foreground-base-primary)]",
      },
      size: {
        default:
          "px-[var(--rs-space-4)] py-[var(--rs-space-3)] [font-size:var(--rs-font-size-small)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)]",
        xs: "gap-[var(--rs-space-2)] rounded-[var(--rs-radius-1)] px-[var(--rs-space-2)] py-[var(--rs-space-1)] [font-size:var(--rs-font-size-micro)] [letter-spacing:var(--rs-letter-spacing-micro)] [line-height:var(--rs-line-height-micro)] [&_svg:not([class*='size-'])]:size-3",
        sm: "gap-[var(--rs-space-2)] px-[var(--rs-space-3)] py-[var(--rs-space-2)] [font-size:var(--rs-font-size-mini)] [letter-spacing:var(--rs-letter-spacing-mini)] [line-height:var(--rs-line-height-mini)]",
        lg: "px-[var(--rs-space-5)] py-[var(--rs-space-3)] [font-size:var(--rs-font-size-regular)] [letter-spacing:var(--rs-letter-spacing-regular)] [line-height:var(--rs-line-height-regular)]",
        xl: "px-[var(--rs-space-6)] py-[var(--rs-space-4)] [font-size:var(--rs-font-size-large)] [letter-spacing:var(--rs-letter-spacing-large)] [line-height:var(--rs-line-height-large)] [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-8 p-0",
        "icon-sm": "size-6 p-0",
        "icon-lg": "size-9 p-0",
      },
      appearance: {
        flat: null,
        glossy:
          "bg-[linear-gradient(180deg,rgba(255,255,255,.46)_0%,rgba(255,255,255,.12)_38%,transparent_39%),linear-gradient(180deg,rgba(255,255,255,.12)_0%,transparent_54%,rgba(0,0,0,.18)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.5),inset_0_0_5px_rgba(255,255,255,.18),inset_0_-18px_15px_-14px_rgba(0,0,0,.35),0_0_0_.75px_rgba(0,0,0,.24),0_3px_8px_rgba(0,0,0,.24)]! [text-shadow:0_1px_2px_rgba(0,0,0,.35)] transition-[filter,box-shadow] duration-200 hover:brightness-[1.06]",
        glow:
          "bg-[linear-gradient(180deg,rgba(0,0,0,.18)_0%,rgba(255,255,255,.08)_100%)] shadow-[inset_0_-1.5px_2px_rgba(255,255,255,.45),inset_0_0_12px_rgba(255,255,255,.22),inset_0_0_8px_rgba(255,255,255,.18),0_2px_6px_rgba(0,0,0,.28)]! [text-shadow:0_1px_2px_rgba(0,0,0,.4)] transition-[filter,box-shadow] duration-200 hover:brightness-[1.12]",
        bevel:
          "bg-[linear-gradient(180deg,rgba(255,255,255,.2)_0%,transparent_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_1px_0_rgba(0,0,0,.28),0_2px_0_rgba(0,0,0,.28),0_3px_0_rgba(0,0,0,.38),0_4px_0_rgba(0,0,0,.38),0_6px_8px_rgba(0,0,0,.3)]! [text-shadow:0_1px_0_rgba(0,0,0,.4)] transition-[transform,box-shadow] duration-120 hover:-translate-y-px [&:is(:active,[data-pressed])]:translate-y-1 [&:is(:active,[data-pressed])]:shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_1px_0_rgba(0,0,0,.38),0_2px_4px_rgba(0,0,0,.28)]!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      appearance: "flat",
    },
  }
)

interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  appearance?: VariantProps<typeof buttonVariants>["appearance"]
  asChild?: boolean
}

function Button({
  className,
  variant,
  size,
  appearance,
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
    className: cn(buttonVariants({ variant, size, appearance, className })),
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
