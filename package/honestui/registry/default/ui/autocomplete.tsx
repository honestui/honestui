"use client"

import { Autocomplete as AutocompletePrimitive } from "@base-ui-components/react/autocomplete"
import { ChevronsUpDown as ChevronsUpDownIcon, X as XIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Input } from "@/registry/default/ui/input"
import { ScrollArea } from "@/registry/default/ui/scroll-area"

const Autocomplete = AutocompletePrimitive.Root

function AutocompleteInput({
  className,
  showTrigger = false,
  showClear = false,
  size,
  ...props
}: Omit<AutocompletePrimitive.Input.Props, "size"> & {
  showTrigger?: boolean
  showClear?: boolean
  size?: "sm" | "default" | "lg" | number
}) {
  const sizeValue = (size ?? "default") as "sm" | "default" | "lg" | number

  return (
    <div className="relative w-full">
      <AutocompletePrimitive.Input
        data-slot="autocomplete-input"
        className={cn(
          sizeValue === "sm"
            ? "has-[+[data-slot=autocomplete-trigger],+[data-slot=autocomplete-clear]]:*:data-[slot=autocomplete-input]:pe-6.5"
            : "has-[+[data-slot=autocomplete-trigger],+[data-slot=autocomplete-clear]]:*:data-[slot=autocomplete-input]:pe-7",
          className
        )}
        render={<Input size={sizeValue} />}
        {...props}
      />
      {showTrigger && (
        <AutocompleteTrigger
          className={cn(
            "absolute top-1/2 inline-flex size-7 shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent opacity-72 transition-colors outline-none hover:opacity-100 has-[+[data-slot=autocomplete-clear]]:hidden pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            sizeValue === "sm" ? "end-0" : "end-0.5"
          )}
        >
          <ChevronsUpDownIcon />
        </AutocompleteTrigger>
      )}
      {showClear && (
        <AutocompleteClear
          className={cn(
            "absolute top-1/2 inline-flex size-7 shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent opacity-72 transition-colors outline-none hover:opacity-100 has-[+[data-slot=autocomplete-clear]]:hidden pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            sizeValue === "sm" ? "end-0" : "end-0.5"
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
  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner
        data-slot="autocomplete-positioner"
        className="z-50 select-none"
        sideOffset={sideOffset}
      >
        <span className="relative flex max-h-full origin-(--transform-origin) rounded-[var(--hui-radius-2)] border bg-[var(--hui-color-background-base-primary)] bg-clip-padding transition-[scale,opacity] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--hui-radius-2)-1px)] before:shadow-[var(--hui-shadow-floating)] has-data-starting-style:scale-98 has-data-starting-style:opacity-0 dark:not-in-data-[slot=group]:bg-clip-border">
          <AutocompletePrimitive.Popup
            data-slot="autocomplete-popup"
            className={cn(
              "flex max-h-[min(var(--available-height),23rem)] w-(--anchor-width) max-w-(--available-width) flex-col",
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
        "flex cursor-default items-center rounded-[var(--hui-radius-1)] px-2 py-1 [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] outline-none select-none data-disabled:pointer-events-none data-disabled:text-[var(--hui-color-foreground-base-tertiary)] data-highlighted:bg-[var(--hui-color-background-base-primary-hover)] data-highlighted:text-[var(--hui-color-foreground-base-primary)]",
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
      className={cn("mx-2 my-1 h-px bg-[var(--hui-color-border-base-primary)] last:hidden", className)}
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
        "px-2 py-1.5 [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] font-medium text-[var(--hui-color-foreground-base-secondary)]",
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
  ...props
}: AutocompletePrimitive.Clear.Props) {
  return (
    <AutocompletePrimitive.Clear
      data-slot="autocomplete-clear"
      className={cn(
        "absolute end-0.5 top-1/2 inline-flex size-7 shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent opacity-72 transition-[color,background-color,box-shadow,opacity] outline-none hover:opacity-100 pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <XIcon />
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
