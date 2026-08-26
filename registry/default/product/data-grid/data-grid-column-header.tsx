"use client"

import * as React from "react"
import type { Column } from "@tanstack/react-table"
import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
  Ellipsis as EllipsisIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/registry/default/ui/menu"

import {
  getDataGridColumnMeta,
  getDataGridColumnTitle,
  useDataGridContext,
} from "./data-grid-context"

function toggleColumnSorting<TData>(
  column: Column<TData, unknown>,
  multi: boolean,
) {
  const sorted = column.getIsSorted()
  if (!sorted) column.toggleSorting(false, multi)
  else if (sorted === "asc") column.toggleSorting(true, multi)
  else column.clearSorting()
}

export function DataGridColumnHeader<TData>({
  column,
  className,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  column: Column<TData, unknown>
  className?: string
  draggable?: boolean
  onDragStart?: React.DragEventHandler<HTMLDivElement>
  onDragOver?: React.DragEventHandler<HTMLDivElement>
  onDrop?: React.DragEventHandler<HTMLDivElement>
  onDragEnd?: React.DragEventHandler<HTMLDivElement>
}) {
  const {
    table,
    columnReorderEnabled,
    columnPinningEnabled,
    columnResizeEnabled,
  } = useDataGridContext<TData>()
  const title = getDataGridColumnTitle(column)
  const sorted = column.getIsSorted()
  const sortIndex = column.getSortIndex()
  const columns = table.getVisibleLeafColumns()
  const alignment = getDataGridColumnMeta(column).align ?? "left"
  const header = table.getFlatHeaders().find((item) => item.column.id === column.id)
  const resizeHandler = header?.getResizeHandler()
  const minSize = column.columnDef.minSize ?? 40
  const maxSize = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
  const currentSize = Math.round(column.getSize())
  const visibleIndex = columns.findIndex((item) => item.id === column.id)
  const canMove =
    columnReorderEnabled && getDataGridColumnMeta(column).reorderable !== false

  const move = (offset: -1 | 1) => {
    const target = columns[visibleIndex + offset]
    if (!target) return
    const order = table.getState().columnOrder.length
      ? table.getState().columnOrder
      : table.getAllLeafColumns().map((item) => item.id)
    const sourceIndex = order.indexOf(column.id)
    const targetIndex = order.indexOf(target.id)
    const next = [...order]
    next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, column.id)
    table.setColumnOrder(next)
  }

  return (
    <div
      data-slot="data-grid-column-header"
      className={cn("flex min-w-0 items-center", className)}
    >
      <div
        data-slot="data-grid-column-drag-region"
        draggable={draggable}
        className={cn(
          "relative flex min-w-0 flex-1 items-center gap-[var(--hui-space-1)]",
          alignment === "right" && "justify-end ps-[var(--hui-space-6)]",
          alignment === "center" && "justify-center px-[var(--hui-space-6)]",
          draggable && "cursor-grab active:cursor-grabbing",
        )}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      >
        {column.getCanSort() ? (
          <Button
            variant="link"
            size="sm"
            className={cn(
              "min-w-0 border-0 px-[var(--hui-space-2)] py-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-tertiary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)]",
              alignment === "left" &&
                "-ms-[var(--hui-space-2)] justify-start",
              alignment === "center" && "justify-center",
              alignment === "right" &&
                "-me-[var(--hui-space-2)] ms-auto justify-end",
            )}
            aria-label={`Sort by ${title}`}
            onClick={(event) => toggleColumnSorting(column, event.shiftKey)}
          >
            <span className="truncate">{title}</span>
            {sorted === "asc" ? (
              <ArrowUpIcon aria-hidden className="size-3.5" />
            ) : sorted === "desc" ? (
              <ArrowDownIcon aria-hidden className="size-3.5" />
            ) : (
              <ChevronsUpDownIcon aria-hidden className="size-3.5 opacity-60" />
            )}
            {sortIndex > 0 && (
              <span className="tabular-nums text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-micro)]">
                {sortIndex + 1}
              </span>
            )}
          </Button>
        ) : (
          <span
            className={cn(
              "truncate",
              alignment === "center" && "mx-auto",
              alignment === "right" && "ms-auto",
            )}
          >
            {title}
          </span>
        )}

        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="link"
                size="icon-sm"
                className={cn(
                  "opacity-0 focus-visible:opacity-100 group-hover/header:opacity-100 data-popup-open:opacity-100",
                  alignment === "left" && "ms-auto",
                  alignment === "center" && "absolute end-0",
                  alignment === "right" && "absolute start-0",
                )}
                aria-label={`Column options for ${title}`}
              />
            }
          >
            <EllipsisIcon aria-hidden />
          </MenuTrigger>
          <MenuPopup align="start">
            {column.getCanSort() && (
              <>
                <MenuItem onClick={() => column.toggleSorting(false)}>Sort ascending</MenuItem>
                <MenuItem onClick={() => column.toggleSorting(true)}>Sort descending</MenuItem>
                {sorted && <MenuItem onClick={() => column.clearSorting()}>Clear sort</MenuItem>}
              </>
            )}
            {canMove && (
              <>
                <MenuSeparator />
                <MenuItem disabled={visibleIndex <= 0} onClick={() => move(-1)}>Move left</MenuItem>
                <MenuItem disabled={visibleIndex >= columns.length - 1} onClick={() => move(1)}>Move right</MenuItem>
              </>
            )}
            {columnPinningEnabled && column.getCanPin() && (
              <>
                <MenuSeparator />
                <MenuItem onClick={() => column.pin("left")}>Pin left</MenuItem>
                <MenuItem onClick={() => column.pin("right")}>Pin right</MenuItem>
                {column.getIsPinned() && <MenuItem onClick={() => column.pin(false)}>Unpin</MenuItem>}
              </>
            )}
            {(column.getCanHide() || (columnResizeEnabled && column.getCanResize())) && <MenuSeparator />}
            {columnResizeEnabled && column.getCanResize() && (
              <MenuItem onClick={() => column.resetSize()}>Reset width</MenuItem>
            )}
            {column.getCanHide() && (
              <MenuItem onClick={() => column.toggleVisibility(false)}>Hide column</MenuItem>
            )}
          </MenuPopup>
        </Menu>
      </div>

      {columnResizeEnabled && column.getCanResize() && (
        <span
          role="separator"
          draggable={false}
          aria-label={`Resize ${title} column`}
          aria-orientation="vertical"
          aria-valuemin={minSize}
          aria-valuemax={maxSize}
          aria-valuenow={currentSize}
          aria-valuetext={`${currentSize} pixels`}
          tabIndex={0}
          data-slot="data-grid-resize-handle"
          className="absolute inset-y-0 end-0 z-2 w-2 translate-x-1/2 cursor-col-resize touch-none select-none after:absolute after:inset-y-0 after:start-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent hover:after:bg-[var(--hui-color-border-base-focus)] focus-visible:outline-none focus-visible:after:w-0.5 focus-visible:after:bg-[var(--hui-color-border-accent-emphasis)] data-[resizing=true]:after:bg-[var(--hui-color-border-accent-emphasis)] forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight]"
          data-resizing={column.getIsResizing() ? "true" : undefined}
          onDoubleClick={() => column.resetSize()}
          onDragStart={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onMouseDown={(event) => {
            event.stopPropagation()
            resizeHandler?.(event)
          }}
          onTouchStart={(event) => {
            event.stopPropagation()
            resizeHandler?.(event)
          }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
            event.preventDefault()
            const direction = event.key === "ArrowRight" ? 8 : -8
            table.setColumnSizing((current) => ({
              ...current,
              [column.id]: Math.min(
                maxSize,
                Math.max(
                  minSize,
                  column.getSize() + direction,
                ),
              ),
            }))
          }}
        />
      )}
    </div>
  )
}
