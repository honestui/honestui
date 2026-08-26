"use client"

import * as React from "react"
import type { Column } from "@tanstack/react-table"
import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.ComponentProps<"div"> {
  column: Column<TData, TValue>
  title: string
}

function toggleDataTableColumnSorting<TData, TValue>(
  column: Column<TData, TValue>,
) {
  const sorted = column.getIsSorted()

  if (!sorted) {
    column.toggleSorting(false)
  } else if (sorted === "asc") {
    column.toggleSorting(true)
  } else {
    column.clearSorting()
  }
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted()

  return (
    <div className={cn("flex items-center gap-[var(--hui-space-1)]", className)} {...props}>
      <Button
        variant="ghost"
        size="sm"
        className="-ms-[var(--hui-space-2)] h-auto border-0 px-[var(--hui-space-2)] py-[var(--hui-space-1)] font-medium [font-size:var(--hui-font-size-small)] text-[var(--hui-color-foreground-base-tertiary)]"
        aria-label={`Sort by ${title}`}
        onClick={() => toggleDataTableColumnSorting(column)}
      >
        <span>{title}</span>
        {sorted === "asc" ? (
          <ArrowUpIcon aria-hidden />
        ) : sorted === "desc" ? (
          <ArrowDownIcon aria-hidden />
        ) : (
          <ChevronsUpDownIcon aria-hidden className="opacity-60" />
        )}
      </Button>
    </div>
  )
}
