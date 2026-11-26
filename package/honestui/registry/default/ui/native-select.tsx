"use client"

import * as React from "react"
import { Field as FieldPrimitive } from "@base-ui/react/field"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown as ChevronDownIcon } from "honestui/icons"

import { cn } from "@/lib/utils"

// The same edge, fill, focus ring, and states as the Select trigger, applied
// to a real <select>. The browser's arrow is removed and the end padding
// leaves room for the chevron drawn over the control.
const nativeSelectVariants = cva(
  [
    "box-border w-full min-w-0 cursor-pointer appearance-none truncate rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] text-[var(--hui-color-foreground-base-primary)] outline-none [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)] motion-safe:[transition:var(--hui-transition-interactive)]",
    // Focus: the field ring, the same as Input and the Select trigger.
    "focus:border-[var(--hui-color-border-accent-emphasis)] focus:outline-2 focus:outline-solid focus:outline-transparent focus:shadow-[var(--hui-focus-ring-field)] focus:outline-offset-[var(--hui-focus-ring-offset-inset-border)]",
    // Invalid: from Field validation (data-invalid) or a hand-set aria-invalid.
    "data-invalid:border-[var(--hui-color-border-danger-emphasis)] aria-invalid:border-[var(--hui-color-border-danger-emphasis)] data-invalid:focus:border-[var(--hui-color-border-danger-emphasis-hover)] aria-invalid:focus:border-[var(--hui-color-border-danger-emphasis-hover)] data-invalid:focus:shadow-[var(--hui-focus-ring-field-danger)] aria-invalid:focus:shadow-[var(--hui-focus-ring-field-danger)]",
    "disabled:cursor-not-allowed disabled:bg-[var(--hui-color-background-base-secondary)] disabled:text-[var(--hui-color-foreground-base-tertiary)] data-disabled:cursor-not-allowed data-disabled:bg-[var(--hui-color-background-base-secondary)] data-disabled:text-[var(--hui-color-foreground-base-tertiary)]",
    // Some platforms paint the open list with page colors, so options take
    // the overlay surface to stay legible in dark mode.
    "[&_option]:bg-[var(--hui-color-background-overlay)] [&_option]:text-[var(--hui-color-foreground-base-primary)] [&_optgroup]:bg-[var(--hui-color-background-overlay)] [&_optgroup]:text-[var(--hui-color-foreground-base-secondary)]",
    // Customizable select: where the browser supports appearance: base-select,
    // the element stays a real <select> (form value, keyboard, autofill) but
    // its open list is drawn like the Select popup: the overlay surface,
    // padded rows with the overlay hover, and a trailing check on the chosen
    // row only. Other browsers keep the platform picker above.
    "supports-[appearance:base-select]:[appearance:base-select] supports-[appearance:base-select]:flex supports-[appearance:base-select]:items-center supports-[appearance:base-select]:py-0 supports-[appearance:base-select]:[&::picker-icon]:hidden",
    "supports-[appearance:base-select]:[&::picker(select)]:[appearance:base-select] supports-[appearance:base-select]:[&::picker(select)]:box-border supports-[appearance:base-select]:[&::picker(select)]:my-[var(--hui-space-2)] supports-[appearance:base-select]:[&::picker(select)]:rounded-[var(--hui-radius-2)] supports-[appearance:base-select]:[&::picker(select)]:[border:0.5px_solid_var(--hui-color-border-overlay)] supports-[appearance:base-select]:[&::picker(select)]:bg-[var(--hui-color-background-overlay)] supports-[appearance:base-select]:[&::picker(select)]:p-[var(--hui-space-2)] supports-[appearance:base-select]:[&::picker(select)]:text-[var(--hui-color-foreground-base-primary)] supports-[appearance:base-select]:[&::picker(select)]:shadow-[var(--hui-shadow-overlay,var(--hui-shadow-soft))]",
    "supports-[appearance:base-select]:[&_option]:flex supports-[appearance:base-select]:[&_option]:cursor-pointer supports-[appearance:base-select]:[&_option]:items-center supports-[appearance:base-select]:[&_option]:gap-[var(--hui-space-3)] supports-[appearance:base-select]:[&_option]:min-h-[var(--hui-density-item-min-height,0px)] supports-[appearance:base-select]:[&_option]:rounded-[var(--hui-radius-item,var(--hui-radius-2))] supports-[appearance:base-select]:[&_option]:px-[var(--hui-space-3)] supports-[appearance:base-select]:[&_option]:py-[var(--hui-density-item-padding-block,var(--hui-space-3))] supports-[appearance:base-select]:[&_option]:bg-transparent supports-[appearance:base-select]:[&_option]:outline-none supports-[appearance:base-select]:[&_option]:[font-size:var(--hui-font-size-control,13px)] supports-[appearance:base-select]:[&_option]:[font-weight:var(--hui-font-weight-regular)] supports-[appearance:base-select]:[&_option:is(:hover,:focus-visible)]:bg-[var(--hui-color-background-overlay-hover)] supports-[appearance:base-select]:[&_option:disabled]:cursor-not-allowed supports-[appearance:base-select]:[&_option:disabled]:bg-transparent supports-[appearance:base-select]:[&_option:disabled]:text-[var(--hui-color-foreground-base-tertiary)]",
    // The check is the Check icon as a mask, shown only on the chosen row so
    // other rows don't reserve empty space for it.
    "supports-[appearance:base-select]:[&_option::checkmark]:order-1 supports-[appearance:base-select]:[&_option::checkmark]:ms-auto supports-[appearance:base-select]:[&_option::checkmark]:size-4 supports-[appearance:base-select]:[&_option::checkmark]:shrink-0 supports-[appearance:base-select]:[&_option::checkmark]:bg-current supports-[appearance:base-select]:[&_option::checkmark]:content-[''] supports-[appearance:base-select]:[&_option::checkmark]:[mask:url(data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22black%22%20stroke-width=%221.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22M20%206%209%2017l-5-5%22/%3E%3C/svg%3E)_center/contain_no-repeat] supports-[appearance:base-select]:[&_option:not(:checked)::checkmark]:hidden",
    // Group labels match SelectLabel; their options reset to row styling.
    "supports-[appearance:base-select]:[&_optgroup]:bg-transparent supports-[appearance:base-select]:[&_optgroup]:[font-size:var(--hui-font-size-small)] supports-[appearance:base-select]:[&_optgroup]:[font-weight:var(--hui-font-weight-medium)] supports-[appearance:base-select]:[&_optgroup]:text-[var(--hui-color-foreground-base-secondary)] supports-[appearance:base-select]:[&_optgroup_option]:text-[var(--hui-color-foreground-base-primary)]",
    // Forced colors drop custom fills, so keep a system border.
    "forced-colors:border forced-colors:border-[ButtonText]",
  ],
  {
    variants: {
      size: {
        sm: "h-[var(--hui-control-height-sm,var(--hui-space-8))] ps-[var(--hui-field-padding-inline,var(--hui-space-3))] pe-[calc(var(--hui-field-padding-inline,var(--hui-space-3))+var(--hui-space-4)+var(--hui-space-2))] [font-size:var(--hui-font-size-control-sm,var(--hui-font-size-small))]",
        default:
          "h-[var(--hui-density-control-height,36px)] ps-[var(--hui-field-padding-inline,var(--hui-space-3))] pe-[calc(var(--hui-field-padding-inline,var(--hui-space-3))+var(--hui-space-5)+var(--hui-space-3))]",
        lg: "h-[var(--hui-control-height-lg,44px)] ps-[var(--hui-space-4)] pe-[calc(var(--hui-space-4)+var(--hui-space-5)+var(--hui-space-3))]",
      },
      variant: {
        outline:
          "border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] not-focus:not-disabled:not-data-disabled:not-data-invalid:not-aria-invalid:hover:border-[var(--hui-color-border-field-hover,var(--hui-color-border-field,var(--hui-color-border-base-tertiary)))] disabled:border-[var(--hui-color-border-base-primary)] data-disabled:border-[var(--hui-color-border-base-primary)]",
        text: "border-0 not-disabled:not-data-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] not-disabled:not-data-disabled:active:bg-[var(--hui-color-background-neutral-secondary)]",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "outline",
    },
  }
)

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> &
  VariantProps<typeof nativeSelectVariants> & {
    /** Classes for the wrapper that positions the chevron. */
    wrapperClassName?: string
  }

function NativeSelect({
  className,
  wrapperClassName,
  size = "default",
  variant = "outline",
  children,
  ...props
}: NativeSelectProps) {
  return (
    <span
      data-slot="native-select-wrapper"
      data-size={size}
      className={cn("relative inline-flex w-full", wrapperClassName)}
    >
      {/* Field.Control registers the select with a surrounding Field, so
          FieldLabel, FieldDescription, and validation work as with Input. */}
      <FieldPrimitive.Control
        data-hui=""
        data-slot="native-select"
        data-size={size}
        data-variant={variant}
        render={<select />}
        className={cn(nativeSelectVariants({ size, variant }), className)}
        {...(props as unknown as FieldPrimitive.Control.Props)}
      >
        {children}
      </FieldPrimitive.Control>
      <ChevronDownIcon
        aria-hidden="true"
        data-slot="native-select-icon"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--hui-color-foreground-base-secondary)]",
          size === "sm"
            ? "end-[var(--hui-field-padding-inline,var(--hui-space-3))] size-[var(--hui-space-4)]"
            : size === "lg"
              ? "end-[var(--hui-space-4)] size-[var(--hui-space-5)]"
              : "end-[var(--hui-field-padding-inline,var(--hui-space-3))] size-[var(--hui-space-5)]"
        )}
      />
    </span>
  )
}

function NativeSelectOption(props: React.ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />
}

function NativeSelectOptGroup(props: React.ComponentProps<"optgroup">) {
  return <optgroup data-slot="native-select-optgroup" {...props} />
}

export {
  NativeSelect,
  NativeSelectOption,
  NativeSelectOptGroup,
  nativeSelectVariants,
}
