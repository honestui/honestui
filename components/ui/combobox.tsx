"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import {
  Check as CheckIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
  X as XIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDensity } from "@/registry/default/ui/density"

const ComboboxContext = React.createContext<{
  // The field or chips container the popup positions against.
  anchorRef: React.RefObject<HTMLDivElement | null> | null
  multiple: boolean
}>({
  anchorRef: null,
  multiple: false,
})

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

function Combobox<
  ItemValue,
  Multiple extends boolean | undefined = false,
>(props: ComboboxPrimitive.Root.Props<ItemValue, Multiple>) {
  const anchorRef = React.useRef<HTMLDivElement | null>(null)
  return (
    <ComboboxContext.Provider value={{ anchorRef, multiple: !!props.multiple }}>
      <ComboboxPrimitive.Root {...props} />
    </ComboboxContext.Provider>
  )
}

function ComboboxInput({
  className,
  showTrigger = true,
  showClear = false,
  triggerProps,
  clearProps,
  size,
  ...props
}: Omit<ComboboxPrimitive.Input.Props, "size"> & {
  showTrigger?: boolean
  showClear?: boolean
  /** Props for the built-in trigger, e.g. a translated `aria-label`. */
  triggerProps?: ComboboxPrimitive.Trigger.Props
  /** Props for the built-in clear button, e.g. a translated `aria-label`. */
  clearProps?: ComboboxPrimitive.Clear.Props
  size?: "sm" | "default" | "lg" | number
}) {
  const { anchorRef, multiple } = React.useContext(ComboboxContext)
  const sizeValue = (size ?? "default") as "sm" | "default" | "lg" | number

  // multiple mode
  if (multiple) {
    return (
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        className={cn(
          "min-w-12 flex-1 [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] outline-none [[data-slot=combobox-chip]+&]:ps-0.5",
          sizeValue === "sm" ? "ps-1.5" : "ps-2",
          className
        )}
        data-size={typeof sizeValue === "string" ? sizeValue : undefined}
        size={typeof sizeValue === "number" ? sizeValue : undefined}
        {...props}
        onKeyDown={(event) => {
          props.onKeyDown?.(event)
          // With the popup closed, Base UI's Escape clears every chip at once
          // with no undo. Leave chips to Backspace and their remove buttons.
          if (
            event.key === "Escape" &&
            event.currentTarget.getAttribute("aria-expanded") !== "true"
          ) {
            event.preventBaseUIHandler()
          }
        }}
      />
    )
  }
  // single mode
  return (
    // The popup anchors to this wrapper, so it lines up with the visible field
    // edge rather than the inner input.
    <div
      ref={anchorRef}
      className="group/combobox-field relative w-full has-disabled:text-[var(--hui-color-foreground-base-tertiary)]"
    >
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        className={cn(
          sizeValue === "sm"
            ? "has-[+[data-slot=combobox-trigger],+[data-slot=combobox-clear]]:*:data-[slot=combobox-input]:pe-6.5"
            : "has-[+[data-slot=combobox-trigger],+[data-slot=combobox-clear]]:*:data-[slot=combobox-input]:pe-7",
          className
        )}
        render={
          <Input
            size={sizeValue}
            // The trigger and clear buttons sit over the field, so hovering
            // them still counts as hovering the field.
            className="has-disabled:opacity-100 not-focus-within:not-has-[input:is([data-invalid],[aria-invalid=true],[data-disabled],:read-only)]:not-data-disabled:group-hover/combobox-field:border-[var(--hui-color-border-field-hover,var(--hui-color-border-field,var(--hui-color-border-base-tertiary)))]"
          />
        }
        {...props}
      />
      {showTrigger && (
        <ComboboxTrigger
          aria-label="Show options"
          {...triggerProps}
          className={cn(
            "absolute top-1/2 inline-flex size-7 shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent text-[var(--hui-color-foreground-base-secondary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)] has-[+[data-slot=combobox-clear]]:hidden pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            sizeValue === "sm" ? "end-0" : "end-0.5",
            triggerProps?.className as string | undefined
          )}
        >
          <ChevronsUpDownIcon />
        </ComboboxTrigger>
      )}
      {showClear && (
        <ComboboxClear
          aria-label="Clear"
          {...clearProps}
          className={cn(
            "absolute top-1/2 inline-flex size-7 shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent text-[var(--hui-color-foreground-base-secondary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)] pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            sizeValue === "sm" ? "end-0" : "end-0.5",
            clearProps?.className as string | undefined
          )}
        >
          <XIcon />
        </ComboboxClear>
      )}
    </div>
  )
}

function ComboboxTrigger({
  className,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      aria-label={
        hasNoContent(props.children, props.render) ? "Show options" : undefined
      }
      data-slot="combobox-trigger"
      className={className}
      {...props}
    />
  )
}

function ComboboxPopup({
  className,
  children,
  sideOffset = 4,
  ...props
}: ComboboxPrimitive.Popup.Props & {
  sideOffset?: number
}) {
  const { anchorRef } = React.useContext(ComboboxContext)
  const density = useDensity()

  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        data-slot="combobox-positioner"
        className="z-[var(--hui-z-index-portal)] select-none"
        sideOffset={sideOffset}
        anchor={anchorRef}
      >
        <span className="relative flex max-h-full">
          <ComboboxPrimitive.Popup
            data-slot="combobox-popup"
            data-density={density}
            className={cn(
              "box-border flex max-h-[min(var(--available-height),320px)] min-w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) flex-col overflow-auto rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-overlay)] bg-[var(--hui-color-background-overlay)] shadow-[var(--hui-shadow-overlay,var(--hui-shadow-soft))] [font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)] [transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out)] motion-safe:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out),scale_var(--hui-duration-fast)_var(--hui-ease-out)] motion-safe:data-ending-style:scale-[0.97] data-ending-style:opacity-0 motion-safe:data-starting-style:scale-[0.97] data-starting-style:opacity-0 [&:has([data-slot=combobox-list]:empty):not(:has([data-slot=combobox-empty]:not(:empty)))]:border-0",
              className
            )}
            {...props}
          >
            {children}
          </ComboboxPrimitive.Popup>
        </span>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex items-center gap-[var(--hui-space-3)] whitespace-normal break-words min-h-[var(--hui-density-item-min-height,0px)] rounded-[var(--hui-radius-item,var(--hui-radius-2))] px-[var(--hui-space-3)] py-[var(--hui-density-item-padding-block,var(--hui-space-3))] text-[var(--hui-color-foreground-base-primary)] outline-none in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] data-disabled:pointer-events-none data-disabled:text-[var(--hui-color-foreground-base-tertiary)] data-highlighted:cursor-pointer data-highlighted:bg-[var(--hui-color-background-overlay-hover)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--hui-space-5)]",
        className
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {/* The check sits at the end so labels stay aligned as selection changes. */}
      <ComboboxPrimitive.ItemIndicator className="flex shrink-0 items-center justify-center">
        <CheckIcon className="size-4" aria-hidden="true" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      className={cn(
        "my-[var(--hui-space-2)] h-0 border-t-[0.5px] border-[var(--hui-color-border-overlay)] [margin-inline:calc(var(--hui-space-2)*-1)] last:hidden",
        className
      )}
      data-slot="combobox-separator"
      {...props}
    />
  )
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={className}
      {...props}
    />
  )
}

function ComboboxGroupLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      className={cn(
        "px-[var(--hui-space-3)] py-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)] text-[var(--hui-color-foreground-base-secondary)]",
        className
      )}
      data-slot="combobox-group-label"
      {...props}
    />
  )
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      className={cn(
        "text-center [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] text-[var(--hui-color-foreground-base-secondary)] not-empty:p-2",
        className
      )}
      data-slot="combobox-empty"
      {...props}
    />
  )
}

function ComboboxRow({ className, ...props }: ComboboxPrimitive.Row.Props) {
  return (
    <ComboboxPrimitive.Row
      data-slot="combobox-row"
      className={className}
      {...props}
    />
  )
}

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ScrollArea className="flex-1">
      <ComboboxPrimitive.List
        data-slot="combobox-list"
        className={cn(
          "p-[var(--hui-space-2)] empty:p-0 in-data-has-overflow-y:pe-3",
          className
        )}
        {...props}
      />
    </ScrollArea>
  )
}

function ComboboxClear({
  className,
  children,
  ...props
}: ComboboxPrimitive.Clear.Props) {
  // Without content of its own, the clear shows an X (Base UI's default is "x" text).
  const fallbackIcon = hasNoContent(children, props.render)
  return (
    <ComboboxPrimitive.Clear
      aria-label={fallbackIcon ? "Clear" : undefined}
      data-slot="combobox-clear"
      className={className}
      {...props}
    >
      {fallbackIcon ? <XIcon /> : children}
    </ComboboxPrimitive.Clear>
  )
}

function ComboboxStatus({
  className,
  ...props
}: ComboboxPrimitive.Status.Props) {
  return (
    <ComboboxPrimitive.Status
      data-slot="combobox-status"
      className={cn(
        "px-3 py-2 [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] font-medium text-[var(--hui-color-foreground-base-secondary)] empty:m-0 empty:p-0",
        className
      )}
      {...props}
    />
  )
}

function ComboboxCollection(props: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  )
}

function ComboboxChips({ className, ...props }: ComboboxPrimitive.Chips.Props) {
  const { anchorRef } = React.useContext(ComboboxContext)

  return (
    <ComboboxPrimitive.Chips
      ref={anchorRef}
      data-hui=""
      data-slot="combobox-chips"
      className={cn(
        "relative inline-flex min-h-[var(--hui-density-control-height,36px)] w-full flex-wrap items-center gap-1 rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] bg-clip-padding not-focus-within:not-has-aria-invalid:not-has-disabled:not-has-[input:read-only]:hover:border-[var(--hui-color-border-field-hover,var(--hui-color-border-field,var(--hui-color-border-base-tertiary)))] has-disabled:border-[var(--hui-color-border-base-primary)] p-[calc(--spacing(1)-1px)] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] *:min-h-6 focus-within:border-[var(--hui-color-border-accent-emphasis)] focus-within:outline-2 focus-within:outline-solid focus-within:outline-transparent focus-within:shadow-[var(--hui-focus-ring-field)] focus-within:outline-offset-[var(--hui-focus-ring-offset-inset-border)] has-disabled:pointer-events-none has-disabled:bg-[var(--hui-color-background-base-secondary)] has-aria-invalid:border-[var(--hui-color-border-danger-emphasis)] focus-within:has-aria-invalid:shadow-[var(--hui-focus-ring-field-danger)] focus-within:has-aria-invalid:border-[var(--hui-color-border-danger-emphasis-hover)] has-data-[size=lg]:min-h-[var(--hui-control-height-lg,44px)] has-data-[size=lg]:*:min-h-7 has-data-[size=sm]:min-h-[var(--hui-control-height-sm,var(--hui-space-8))] has-data-[size=sm]:*:min-h-5 dark:not-in-data-[slot=group]:bg-clip-border",
        className
      )}
      {...props}
    />
  )
}

// The chip's label id, so its remove button is named "Remove <label>".
const ComboboxChipContext = React.createContext<string | undefined>(undefined)

function ComboboxChip({
  className,
  children,
  removeLabel = "Remove",
  ...props
}: ComboboxPrimitive.Chip.Props & {
  /** The remove button's verb, read before the chip label ("Remove Apple"). */
  removeLabel?: string
}) {
  const labelId = React.useId()
  return (
    <ComboboxChipContext.Provider value={labelId}>
      <ComboboxPrimitive.Chip
        data-slot="combobox-chip"
        className={cn(
          "flex min-w-0 max-w-full items-center forced-colors:border-[0.5px] forced-colors:border-[CanvasText] rounded-[calc(var(--hui-radius-2)-3px)] bg-[var(--hui-color-background-base-primary-hover)] ps-2 [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] font-medium text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]",
          className
        )}
        {...props}
      >
        <span
          id={labelId}
          // Leading icons, images and avatars sit inline so the label truncates as one line.
          className="min-w-0 truncate [&>svg]:me-1 [&>svg]:inline [&>svg]:align-[-0.2em] [&>svg:not([class*='size-'])]:size-3.5 [&>img]:me-1 [&>img]:inline [&>img]:align-middle [&>[data-slot=avatar]]:me-1 [&>[data-slot=avatar]]:inline-flex [&>[data-slot=avatar]]:align-middle"
        >
          {children}
        </span>
        <ComboboxChipRemove aria-label={removeLabel} />
      </ComboboxPrimitive.Chip>
    </ComboboxChipContext.Provider>
  )
}

function ComboboxChipRemove({
  className,
  ...props
}: ComboboxPrimitive.ChipRemove.Props) {
  const removeId = React.useId()
  const labelId = React.useContext(ComboboxChipContext)
  return (
    <ComboboxPrimitive.ChipRemove
      id={removeId}
      aria-label="Remove"
      // Read as "Remove <chip label>"; the browser computes the label's name.
      aria-labelledby={labelId ? `${removeId} ${labelId}` : undefined}
      data-slot="combobox-chip-remove"
      className={cn(
        "self-stretch shrink-0 cursor-pointer rounded-[calc(var(--hui-radius-2)-3px)] px-1.5 text-[var(--hui-color-foreground-base-secondary)] outline-none hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)] [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    >
      <XIcon />
    </ComboboxPrimitive.ChipRemove>
  )
}

export {
  Combobox,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxPopup,
  ComboboxItem,
  ComboboxSeparator,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxEmpty,
  ComboboxValue,
  ComboboxList,
  ComboboxClear,
  ComboboxStatus,
  ComboboxRow,
  ComboboxCollection,
  ComboboxChips,
  ComboboxChip,
}
