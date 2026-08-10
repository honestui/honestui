"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui-components/react/avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 items-center justify-center overflow-hidden bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-primary)] [--fallback-font-size:calc(var(--hui-space-9,32px)*0.4)] [--fallback-letter-spacing:0.03em] outline-[0.5px] outline-[var(--hui-color-overlay-base-a2)] outline-offset-[-0.5px] select-none",
  {
    variants: {
      variant: {
        solid: "[--avatar-opacity:1]",
        soft: "text-[var(--hui-color-foreground-base-primary)] [--avatar-opacity:0.2]",
      },
      color: {
        indigo:
          "[--avatar-hue:var(--hui-color-background-accent-emphasis)] [--avatar-color:var(--hui-color-foreground-accent-emphasis)]",
        orange:
          "[--avatar-hue:var(--hui-color-background-attention-emphasis)] [--avatar-color:var(--hui-color-foreground-attention-emphasis)]",
        mint: "[--avatar-hue:var(--hui-color-background-success-emphasis)] [--avatar-color:var(--hui-color-foreground-success-emphasis)]",
        neutral:
          "[--avatar-hue:var(--hui-color-background-neutral-emphasis)] [--avatar-color:var(--hui-color-foreground-base-emphasis)]",
        sky: "[--avatar-hue:var(--hui-color-viz-sky-9)] [--avatar-color:var(--hui-color-viz-sky-11)]",
        lime: "[--avatar-hue:var(--hui-color-viz-lime-9)] [--avatar-color:var(--hui-color-viz-lime-11)]",
        grass:
          "[--avatar-hue:var(--hui-color-viz-grass-9)] [--avatar-color:var(--hui-color-viz-grass-11)]",
        cyan: "[--avatar-hue:var(--hui-color-viz-cyan-9)] [--avatar-color:var(--hui-color-viz-cyan-11)]",
        iris: "[--avatar-hue:var(--hui-color-viz-iris-9)] [--avatar-color:var(--hui-color-viz-iris-11)]",
        purple:
          "[--avatar-hue:var(--hui-color-viz-purple-9)] [--avatar-color:var(--hui-color-viz-purple-11)]",
        pink: "[--avatar-hue:var(--hui-color-viz-pink-9)] [--avatar-color:var(--hui-color-viz-pink-11)]",
        crimson:
          "[--avatar-hue:var(--hui-color-viz-crimson-9)] [--avatar-color:var(--hui-color-viz-crimson-11)]",
        gold: "[--avatar-hue:var(--hui-color-viz-gold-9)] [--avatar-color:var(--hui-color-viz-gold-11)]",
      },
      size: {
        "1": "size-[var(--hui-space-5,16px)] rounded-[var(--hui-radius-2)] [--fallback-font-size:calc(var(--hui-space-5,16px)*0.4)] [--fallback-letter-spacing:0.05em]",
        "2": "size-[var(--hui-space-6,20px)] rounded-[var(--hui-radius-2)] [--fallback-font-size:calc(var(--hui-space-6,20px)*0.4)] [--fallback-letter-spacing:0.05em]",
        "3": "size-[var(--hui-space-7,24px)] rounded-[var(--hui-radius-2)] [--fallback-font-size:calc(var(--hui-space-7,24px)*0.4)] [--fallback-letter-spacing:0.04em]",
        "4": "size-[var(--hui-space-8,28px)] rounded-[var(--hui-radius-2)] [--fallback-font-size:calc(var(--hui-space-8,28px)*0.35)] [--fallback-letter-spacing:0.04em]",
        "5": "size-[var(--hui-space-9,32px)] rounded-[var(--hui-radius-2)] [--fallback-font-size:calc(var(--hui-space-9,32px)*0.4)] [--fallback-letter-spacing:0.03em]",
        "6": "size-[var(--hui-space-10,40px)] rounded-[var(--hui-radius-4)] [--fallback-font-size:calc(var(--hui-space-10,40px)*0.35)] [--fallback-letter-spacing:0.02em]",
        "7": "size-[var(--hui-space-11,48px)] rounded-[var(--hui-radius-4)] [--fallback-font-size:calc(var(--hui-space-11,48px)*0.35)] [--fallback-letter-spacing:0.01em]",
        "8": "size-[var(--hui-space-12,56px)] rounded-[var(--hui-radius-4)] [--fallback-font-size:calc(var(--hui-space-12,56px)*0.3)] [--fallback-letter-spacing:0.01em]",
        "9": "size-[var(--hui-space-13,64px)] rounded-[var(--hui-radius-4)] [--fallback-font-size:calc(var(--hui-space-13,64px)*0.3)] [--fallback-letter-spacing:0em]",
        "10": "size-[var(--hui-space-14,72px)] rounded-[var(--hui-radius-5)] [--fallback-font-size:calc(var(--hui-space-14,72px)*0.3)] [--fallback-letter-spacing:0em]",
        "11": "size-[var(--hui-space-15,80px)] rounded-[var(--hui-radius-5)] [--fallback-font-size:calc(var(--hui-space-15,80px)*0.3)] [--fallback-letter-spacing:0em]",
        "12": "size-[var(--hui-space-16,96px)] rounded-[var(--hui-radius-5)] [--fallback-font-size:calc(var(--hui-space-16,96px)*0.3)] [--fallback-letter-spacing:-0.005em]",
        "13": "size-[var(--hui-space-17,120px)] rounded-[var(--hui-radius-5)] [--fallback-font-size:calc(var(--hui-space-17,120px)*0.3)] [--fallback-letter-spacing:-0.01em]",
      },
      shape: {
        rounded: null,
        full: "rounded-[var(--hui-radius-full)]",
      },
      disabled: {
        true: "opacity-50",
        false: null,
      },
    },
    compoundVariants: [
      {
        variant: "solid",
        color: "indigo",
        className:
          "bg-[var(--hui-color-background-accent-emphasis)] text-[var(--hui-color-foreground-accent-emphasis)]",
      },
      {
        variant: "solid",
        color: "orange",
        className:
          "bg-[var(--hui-color-background-attention-emphasis)] text-[var(--hui-color-foreground-attention-primary-hover)]",
      },
      {
        variant: "solid",
        color: "mint",
        className:
          "bg-[var(--hui-color-background-success-emphasis)] text-[var(--hui-color-foreground-success-primary-hover)]",
      },
      {
        variant: "solid",
        color: "neutral",
        className:
          "bg-[var(--hui-color-background-neutral-emphasis)] text-[var(--hui-color-foreground-base-primary)]",
      },
      {
        variant: "solid",
        color: "sky",
        className:
          "bg-[var(--hui-color-viz-sky-9)] text-[var(--hui-color-viz-sky-11)]",
      },
      {
        variant: "solid",
        color: "lime",
        className:
          "bg-[var(--hui-color-viz-lime-9)] text-[var(--hui-color-viz-lime-11)]",
      },
      {
        variant: "solid",
        color: "grass",
        className:
          "bg-[var(--hui-color-viz-grass-8)] text-[var(--hui-color-viz-grass-11)]",
      },
      {
        variant: "solid",
        color: "cyan",
        className:
          "bg-[var(--hui-color-viz-cyan-8)] text-[var(--hui-color-viz-cyan-11)]",
      },
      {
        variant: "solid",
        color: "iris",
        className:
          "bg-[var(--hui-color-viz-iris-8)] text-[var(--hui-color-viz-iris-11)]",
      },
      {
        variant: "solid",
        color: "purple",
        className:
          "bg-[var(--hui-color-viz-purple-8)] text-[var(--hui-color-viz-purple-11)]",
      },
      {
        variant: "solid",
        color: "pink",
        className:
          "bg-[var(--hui-color-viz-pink-8)] text-[var(--hui-color-viz-pink-11)]",
      },
      {
        variant: "solid",
        color: "crimson",
        className:
          "bg-[var(--hui-color-viz-crimson-8)] text-[var(--hui-color-viz-crimson-11)]",
      },
      {
        variant: "solid",
        color: "gold",
        className:
          "bg-[var(--hui-color-viz-gold-8)] text-[var(--hui-color-viz-gold-11)]",
      },
      {
        variant: "soft",
        color: "indigo",
        className: "bg-[var(--hui-color-background-accent-primary)]",
      },
      {
        variant: "soft",
        color: "orange",
        className: "bg-[var(--hui-color-background-attention-primary)]",
      },
      {
        variant: "soft",
        color: "mint",
        className: "bg-[var(--hui-color-background-success-primary)]",
      },
      {
        variant: "soft",
        color: "neutral",
        className: "bg-[var(--hui-color-background-neutral-secondary)]",
      },
      {
        variant: "soft",
        color: "sky",
        className: "bg-[var(--hui-color-viz-sky-6)]",
      },
      {
        variant: "soft",
        color: "lime",
        className: "bg-[var(--hui-color-viz-lime-6)]",
      },
      {
        variant: "soft",
        color: "grass",
        className: "bg-[var(--hui-color-viz-grass-6)]",
      },
      {
        variant: "soft",
        color: "cyan",
        className: "bg-[var(--hui-color-viz-cyan-6)]",
      },
      {
        variant: "soft",
        color: "iris",
        className: "bg-[var(--hui-color-viz-iris-6)]",
      },
      {
        variant: "soft",
        color: "purple",
        className: "bg-[var(--hui-color-viz-purple-6)]",
      },
      {
        variant: "soft",
        color: "pink",
        className: "bg-[var(--hui-color-viz-pink-6)]",
      },
      {
        variant: "soft",
        color: "crimson",
        className: "bg-[var(--hui-color-viz-crimson-6)]",
      },
      {
        variant: "soft",
        color: "gold",
        className: "bg-[var(--hui-color-viz-gold-6)]",
      },
    ],
    defaultVariants: {
      variant: "soft",
      color: "neutral",
      size: "5",
      shape: "full",
      disabled: false,
    },
  }
)

type AvatarProps = Omit<AvatarPrimitive.Root.Props, "color" | "size"> &
  VariantProps<typeof avatarVariants>

function Avatar({
  className,
  variant,
  color,
  size,
  shape,
  disabled,
  ...props
}: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      aria-disabled={disabled || undefined}
      className={cn(
        avatarVariants({ variant, color, size, shape, disabled }),
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "flex size-full box-border object-cover align-middle motion-safe:animate-in motion-safe:fade-in-0 motion-safe:[animation-duration:var(--hui-duration-fast)] motion-safe:[animation-timing-function:var(--hui-ease-out)]",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center [font-size:var(--fallback-font-size)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--fallback-letter-spacing,0.03em)] leading-none",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 flex size-3.5 items-center justify-center rounded-full border-2 border-[var(--hui-color-background-base-primary)] bg-[var(--hui-color-background-accent-emphasis)] text-[0.5rem] text-[var(--hui-color-foreground-accent-emphasis)] [&_svg]:size-2.5",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "flex flex-row items-center [--avatar-overlap:1.2em] [&>*:not(:first-child)]:ml-[calc(-0.5*var(--avatar-overlap))] [&>[data-slot=avatar]]:box-content [&>[data-slot=avatar]]:border [&>[data-slot=avatar]]:border-[var(--hui-color-background-base-primary)] [&>[data-slot=avatar]]:![outline:none]",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-group-count"
      className={cn(
        "relative inline-flex size-[var(--hui-space-9,32px)] shrink-0 items-center justify-center rounded-[var(--hui-radius-full)] border border-[var(--hui-color-background-base-primary)] bg-[var(--hui-color-background-neutral-secondary)] [font-size:calc(var(--hui-space-9,32px)*0.4)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:0.03em] leading-none text-[var(--hui-color-foreground-base-primary)] [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  avatarVariants,
}
