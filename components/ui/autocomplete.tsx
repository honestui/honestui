"use client"

import * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { ChevronsUpDown as ChevronsUpDownIcon, X as XIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDensity } from "@/registry/default/ui/density"

const Autocomplete = AutocompletePrimitive.Root

// A part with no content of its own (no children, and no render element that
// brings children) gets our default label and, for Clear, the X icon. Custom
// icon-only content must pass its own aria-label; a render function decides.
function hasNoContent(children: React.ReactNode, render: unknown) {
  // `false`, "" and [] render nothing, so they count as no content.
  const isEmpty = (node: React.ReactNode) =>
    React.Children.toArray(node).every((child) => child === "")
  if (!isEmpty(children)) return false
  // A render function receives our default label and icon and can override them.
  if (render == null || typeof render === "function") return true
  return (
    React.isValidElement<{ children?: React.ReactNode }>(render) &&
    isEmpty(render.props.children)
  )
}

function AutocompleteInput({
  className,
  showTrigger = false,
  showClear = false,
  triggerProps,
  clearProps,
  size,
  ...props
}: Omit<AutocompletePrimitive.Input.Props, "size"> & {
  showTrigger?: boolean
  showClear?: boolean
  /** Props for the built-in trigger, e.g. a translated `aria-label`. */
  triggerProps?: AutocompletePrimitive.Trigger.Props
  /** Props for the built-in clear button, e.g. a translated `aria-label`. */
  clearProps?: AutocompletePrimitive.Clear.Props
  size?: "sm" | "default" | "lg" | number
}) {
  const sizeValue = (size ?? "default") as "sm" | "default" | "lg" | number

  return (
    <div className="group/autocomplete-field relative w-full">
      <AutocompletePrimitive.Input
        data-slot="autocomplete-input"
        className={cn(
          sizeValue === "sm"
            ? "has-[+[data-slot=autocomplete-trigger],+[data-slot=autocomplete-clear]]:*:data-[slot=autocomplete-input]:pe-6.5"
            : "has-[+[data-slot=autocomplete-trigger],+[data-slot=autocomplete-clear]]:*:data-[slot=autocomplete-input]:pe-7",
          className
        )}
        render={
          <Input
            size={sizeValue}
            // The trigger and clear buttons sit over the field, so hovering
            // them still counts as hovering the field.
            className="not-focus-within:not-has-[input:is([data-invalid],[aria-invalid=true],[data-disabled],:read-only)]:not-data-disabled:group-hover/autocomplete-field:border-[var(--hui-color-border-field-hover,var(--hui-color-border-field,var(--hui-color-border-base-tertiary)))]"
          />
        }
        {...props}
      />
      {showTrigger && (
        <AutocompleteTrigger
          aria-label="Show options"
          {...triggerProps}
          className={cn(
            "absolute top-1/2 inline-flex size-7 shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent text-[var(--hui-color-foreground-base-secondary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)] has-[+[data-slot=autocomplete-clear]]:hidden pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            sizeValue === "sm" ? "end-0" : "end-0.5",
            triggerProps?.className as string | undefined
          )}
        >
          <ChevronsUpDownIcon />
        </AutocompleteTrigger>
      )}
      {showClear && (
        <AutocompleteClear
          aria-label="Clear"
          data-icon-only
          {...clearProps}
          className={cn(
            "absolute top-1/2 inline-flex size-7 shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent text-[var(--hui-color-foreground-base-secondary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)] pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            sizeValue === "sm" ? "end-0" : "end-0.5",
            clearProps?.className as string | undefined
          )}
        >
          <XIcon />
        </AutocompleteClear>
      )}
    </div>
  )
}

function AutocompletePopup({
  className,
  children,
  sideOffset = 4,
  ...props
}: AutocompletePrimitive.Popup.Props & {
  sideOffset?: number
}) {
  const density = useDensity()

  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner
        data-slot="autocomplete-positioner"
        className="z-[var(--hui-z-index-portal)] select-none"
        sideOffset={sideOffset}
      >
        <span className="relative flex max-h-full origin-(--transform-origin) overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-overlay)] bg-[var(--hui-color-background-overlay)] shadow-[var(--hui-shadow-overlay,var(--hui-shadow-soft))] [transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out)] has-data-starting-style:opacity-0 has-data-ending-style:opacity-0 motion-safe:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out),scale_var(--hui-duration-fast)_var(--hui-ease-out)] motion-safe:has-data-starting-style:scale-[0.97] motion-safe:has-data-ending-style:scale-[0.97]">
          <AutocompletePrimitive.Popup
            data-slot="autocomplete-popup"
            data-density={density}
            className={cn(
              "flex max-h-[min(var(--available-height),320px)] w-(--anchor-width) max-w-(--available-width) flex-col",
              className
            )}
            {...props}
          >
            {children}
          </AutocompletePrimitive.Popup>
        </span>
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  )
}

function AutocompleteItem({
  className,
  children,
  ...props
}: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        "flex cursor-default items-center gap-[var(--hui-space-3)] min-h-[var(--hui-density-item-min-height,0px)] rounded-[var(--hui-radius-item,var(--hui-radius-2))] px-[var(--hui-space-3)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-[var(--hui-color-foreground-base-secondary)] data-disabled:[&_svg]:text-[var(--hui-color-foreground-base-tertiary)] [&_svg:not([class*='size-'])]:size-4 py-[var(--hui-density-item-padding-block,var(--hui-space-3))] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-control,16px)] outline-none select-none data-disabled:pointer-events-none data-disabled:text-[var(--hui-color-foreground-base-tertiary)] data-highlighted:bg-[var(--hui-color-background-overlay-hover)] data-highlighted:text-[var(--hui-color-foreground-base-primary)]",
        className
      )}
      {...props}
    >
      {children}
    </AutocompletePrimitive.Item>
  )
}

function AutocompleteSeparator({
  className,
  ...props
}: AutocompletePrimitive.Separator.Props) {
  return (
    <AutocompletePrimitive.Separator
      className={cn("my-[var(--hui-space-2)] h-0 border-t-[0.5px] border-[var(--hui-color-border-overlay)] [margin-inline:calc(var(--hui-space-2)*-1)] last:hidden", className)}
      data-slot="autocomplete-separator"
      {...props}
    />
  )
}

function AutocompleteGroup({
  className,
  ...props
}: AutocompletePrimitive.Group.Props) {
  return (
    <AutocompletePrimitive.Group
      data-slot="autocomplete-group"
      className={className}
      {...props}
    />
  )
}

function AutocompleteGroupLabel({
  className,
  ...props
}: AutocompletePrimitive.GroupLabel.Props) {
  return (
    <AutocompletePrimitive.GroupLabel
      className={cn(
        "px-[var(--hui-space-3)] py-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)] text-[var(--hui-color-foreground-base-secondary)]",
        className
      )}
      data-slot="autocomplete-group-label"
      {...props}
    />
  )
}

function AutocompleteEmpty({
  className,
  ...props
}: AutocompletePrimitive.Empty.Props) {
  return (
    <AutocompletePrimitive.Empty
      className={cn(
        "text-center [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] text-[var(--hui-color-foreground-base-secondary)] not-empty:p-2",
        className
      )}
      data-slot="autocomplete-empty"
      {...props}
    />
  )
}

function AutocompleteRow({
  className,
  ...props
}: AutocompletePrimitive.Row.Props) {
  return (
    <AutocompletePrimitive.Row
      data-slot="autocomplete-row"
      className={className}
      {...props}
    />
  )
}

function AutocompleteValue({ ...props }: AutocompletePrimitive.Value.Props) {
  return (
    <AutocompletePrimitive.Value data-slot="autocomplete-value" {...props} />
  )
}

function AutocompleteList({
  className,
  ...props
}: AutocompletePrimitive.List.Props) {
  return (
    <ScrollArea className="flex-1">
      <AutocompletePrimitive.List
        data-slot="autocomplete-list"
        className={cn(
          "not-empty:scroll-py-1 not-empty:px-1 not-empty:py-1 in-data-has-overflow-y:pe-3",
          className
        )}
        {...props}
      />
    </ScrollArea>
  )
}

function AutocompleteClear({
  className,
  children,
  ...props
}: AutocompletePrimitive.Clear.Props) {
  const fallbackIcon = hasNoContent(children, props.render)
  return (
    <AutocompletePrimitive.Clear
      aria-label={fallbackIcon ? "Clear" : undefined}
      data-icon-only={fallbackIcon || undefined}
      data-slot="autocomplete-clear"
      className={cn(
        "absolute end-0.5 top-1/2 inline-flex h-7 min-w-7 shrink-0 px-[var(--hui-space-2)] data-icon-only:px-0 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent text-[var(--hui-color-foreground-base-secondary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)] pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {fallbackIcon ? <XIcon /> : children}
    </AutocompletePrimitive.Clear>
  )
}

function AutocompleteStatus({
  className,
  ...props
}: AutocompletePrimitive.Status.Props) {
  return (
    <AutocompletePrimitive.Status
      data-slot="autocomplete-status"
      className={cn(
        "px-3 py-2 [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] font-medium text-[var(--hui-color-foreground-base-secondary)] empty:m-0 empty:p-0",
        className
      )}
      {...props}
    />
  )
}

function AutocompleteCollection({
  ...props
}: AutocompletePrimitive.Collection.Props) {
  return (
    <AutocompletePrimitive.Collection
      data-slot="autocomplete-collection"
      {...props}
    />
  )
}

function AutocompleteTrigger({
  className,
  ...props
}: AutocompletePrimitive.Trigger.Props) {
  return (
    <AutocompletePrimitive.Trigger
      aria-label={
        hasNoContent(props.children, props.render) ? "Show options" : undefined
      }
      data-slot="autocomplete-trigger"
      className={className}
      {...props}
    />
  )
}

export {
  Autocomplete,
  AutocompleteInput,
  AutocompleteTrigger,
  AutocompletePopup,
  AutocompleteItem,
  AutocompleteSeparator,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteEmpty,
  AutocompleteValue,
  AutocompleteList,
  AutocompleteClear,
  AutocompleteStatus,
  AutocompleteRow,
  AutocompleteCollection,
}
