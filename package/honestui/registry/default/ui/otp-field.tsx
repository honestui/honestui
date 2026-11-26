"use client"

import * as React from "react"
import { OTPField as OTPFieldPrimitive } from "@base-ui/react/otp-field"

import { cn } from "@/lib/utils"

type OTPFieldSize = "sm" | "default" | "lg"

const OTPFieldSizeContext = React.createContext<OTPFieldSize>("default")

function OTPField({
  className,
  children,
  length,
  size = "default",
  ...props
}: OTPFieldPrimitive.Root.Props & {
  size?: OTPFieldSize
}) {
  return (
    <OTPFieldSizeContext.Provider value={size}>
      <OTPFieldPrimitive.Root
        data-slot="otp-field"
        data-size={size}
        length={length}
        className={cn(
          "flex w-fit items-center gap-[var(--hui-space-2)] data-disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {/* With no children, render one slot per character. The first slot
            takes the field label; the rest name their position. */}
        {children ??
          Array.from({ length }, (_, index) => (
            <OTPFieldInput
              key={index}
              aria-label={
                index === 0 ? undefined : `Character ${index + 1} of ${length}`
              }
            />
          ))}
      </OTPFieldPrimitive.Root>
    </OTPFieldSizeContext.Provider>
  )
}

function OTPFieldInput({ className, ...props }: OTPFieldPrimitive.Input.Props) {
  const size = React.useContext(OTPFieldSizeContext)

  return (
    <OTPFieldPrimitive.Input
      data-hui=""
      data-slot="otp-field-input"
      className={cn(
        // Each slot is a square Input: same edge, fill, focus ring, and
        // invalid and disabled states, sized by the control height so it
        // lines up with buttons and inputs in the same row.
        "relative m-0 box-border",
        // Base UI selects a slot's character on focus so typing replaces it.
        // The selection stays, but it is painted transparent: the focus ring
        // already marks the active slot, and a highlight block reads as noise.
        // !important beats an app's unlayered ::selection color rule.
        "selection:bg-transparent! selection:text-[var(--hui-color-foreground-base-primary)]!",
        "aspect-square size-[var(--hui-density-control-height,36px)] min-w-0 rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] p-0 text-center text-[var(--hui-color-foreground-base-primary)] tabular-nums caret-[var(--hui-color-border-accent-emphasis)] outline-none [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [line-height:var(--hui-line-height-regular)] motion-safe:[transition:var(--hui-transition-interactive)]",
        "placeholder:text-[var(--hui-color-foreground-base-tertiary)]",
        "not-focus:not-data-disabled:not-data-invalid:not-aria-invalid:not-read-only:hover:border-[var(--hui-color-border-field-hover,var(--hui-color-border-field,var(--hui-color-border-base-tertiary)))]",
        "focus:z-1 focus:border-[var(--hui-color-border-accent-emphasis)] focus:outline-2 focus:outline-solid focus:outline-transparent focus:shadow-[var(--hui-focus-ring-field)] focus:outline-offset-[var(--hui-focus-ring-offset-inset-border)]",
        "data-invalid:border-[var(--hui-color-border-danger-emphasis)] data-invalid:focus:border-[var(--hui-color-border-danger-emphasis-hover)] data-invalid:focus:shadow-[var(--hui-focus-ring-field-danger)] aria-invalid:border-[var(--hui-color-border-danger-emphasis)] aria-invalid:focus:border-[var(--hui-color-border-danger-emphasis-hover)] aria-invalid:focus:shadow-[var(--hui-focus-ring-field-danger)]",
        "read-only:bg-[var(--hui-color-background-base-secondary)] data-disabled:cursor-not-allowed data-disabled:border-[var(--hui-color-border-base-primary)] data-disabled:bg-[var(--hui-color-background-base-secondary)] data-disabled:text-[var(--hui-color-foreground-base-tertiary)]",
        "forced-colors:border-[CanvasText] forced-colors:focus:outline-[Highlight]",
        size === "sm" &&
          "size-[var(--hui-control-height-sm,var(--hui-space-8))] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-control,16px)]",
        size === "lg" &&
          "size-[var(--hui-control-height-lg,44px)] rounded-[var(--hui-radius-3)] [font-size:var(--hui-font-size-large)] [line-height:var(--hui-line-height-large)]",
        className
      )}
      {...props}
    />
  )
}

function OTPFieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="otp-field-group"
      className={cn(
        // Joined slots share one hairline edge: inner corners square off and
        // each slot overlaps its neighbour's border. The focused slot rises
        // above its neighbours so its ring is never clipped.
        "flex items-center *:data-[slot=otp-field-input]:rounded-none *:data-[slot=otp-field-input]:not-first:-ms-[0.5px] *:data-[slot=otp-field-input]:first:rounded-s-[var(--hui-radius-2)] *:data-[slot=otp-field-input]:last:rounded-e-[var(--hui-radius-2)] in-data-[size=lg]:*:data-[slot=otp-field-input]:first:rounded-s-[var(--hui-radius-3)] in-data-[size=lg]:*:data-[slot=otp-field-input]:last:rounded-e-[var(--hui-radius-3)]",
        className
      )}
      {...props}
    />
  )
}

function OTPFieldSeparator({
  className,
  children,
  ...props
}: React.ComponentProps<typeof OTPFieldPrimitive.Separator>) {
  return (
    <OTPFieldPrimitive.Separator
      data-slot="otp-field-separator"
      orientation="vertical"
      className={cn(
        "flex shrink-0 items-center justify-center text-[var(--hui-color-foreground-base-tertiary)]",
        className
      )}
      {...props}
    >
      {children ?? (
        <span
          aria-hidden="true"
          className="block h-[1.5px] w-[var(--hui-space-3)] rounded-[var(--hui-radius-full)] bg-current forced-colors:bg-[CanvasText]"
        />
      )}
    </OTPFieldPrimitive.Separator>
  )
}

export {
  OTPField,
  OTPField as InputOTP,
  OTPFieldInput,
  OTPFieldInput as InputOTPSlot,
  OTPFieldGroup,
  OTPFieldGroup as InputOTPGroup,
  OTPFieldSeparator,
  OTPFieldSeparator as InputOTPSeparator,
}
