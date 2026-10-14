import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils.js"

const cardVariants = cva(
  "relative flex flex-col gap-[var(--hui-space-7)] rounded-[var(--hui-radius-2)] py-[var(--hui-space-7)] text-[var(--hui-color-foreground-base-primary)]",
  {
    variants: {
      variant: {
        default:
          "border border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-soft)]",
        soft: "bg-[var(--hui-color-background-base-secondary)]",
        mixed:
          "border border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)]",
        outline:
          "border border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-primary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-[var(--hui-space-2)] px-[var(--hui-space-7)] has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:border-[var(--hui-color-border-base-primary)] [.border-b]:pb-[var(--hui-space-7)]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "[font-size:var(--hui-font-size-large)] [font-weight:var(--hui-font-weight-semibold)] [letter-spacing:var(--hui-letter-spacing-large)] [line-height:var(--hui-line-height-large)]",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]",
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-[var(--hui-space-7)]", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-[var(--hui-space-7)] [.border-t]:border-[var(--hui-color-border-base-primary)] [.border-t]:pt-[var(--hui-space-7)]", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardPanel,
  CardPanel as CardContent,
}
