"use client"

import * as React from "react"
import { Search as SearchIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Input } from "@/registry/default/ui/input"
import { Toolbar } from "@/registry/default/ui/toolbar"

import { useDataTableContext } from "./data-table-context"

export function DataTableToolbar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      data-slot="data-table-toolbar"
      className={cn(
        "flex-wrap items-center gap-[var(--hui-space-2)] rounded-none border-0 p-[var(--hui-space-3)]",
        className,
      )}
      {...props}
    >
      {children}
    </Toolbar>
  )
}

interface DataTableSearchProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "size" | "type"
> {
  placeholder?: string
  debounceMs?: number
  ariaLabel?: string
}

export function DataTableSearch({
  placeholder = "Search...",
  debounceMs,
  ariaLabel,
  className,
  ...props
}: DataTableSearchProps) {
  const { table } = useDataTableContext<unknown>()
  const externalValue = String(table.getState().globalFilter ?? "")
  const defaultAriaLabel = placeholder.replace(/\.\.\.$/, "").trim()
  const resolvedAriaLabel =
    ariaLabel?.trim() || defaultAriaLabel || "Search table"
  const [value, setValue] = React.useState(externalValue)
  const [lastExternalValue, setLastExternalValue] = React.useState(
    externalValue,
  )

  if (externalValue !== lastExternalValue) {
    setLastExternalValue(externalValue)
    setValue(externalValue)
  }

  React.useEffect(() => {
    if (debounceMs === undefined) {
      table.setGlobalFilter(value)
      return
    }

    const timeout = setTimeout(() => {
      table.setGlobalFilter(value)
    }, debounceMs)

    return () => clearTimeout(timeout)
  }, [value, debounceMs, table])

  return (
    <span
      data-slot="data-table-search"
      className={cn("relative block w-full sm:max-w-64", className)}
    >
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute start-[var(--hui-space-3)] top-1/2 z-1 size-3.5 -translate-y-1/2 text-[var(--hui-color-foreground-base-tertiary)]"
      />
      <Input
        type="search"
        aria-label={resolvedAriaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        size="sm"
        className="[&>[data-slot=input]]:!ps-[calc(var(--hui-space-3)+var(--hui-space-5)+2px)]"
        {...props}
      />
    </span>
  )
}
