"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/registry/default/ui/button"
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "honestui/icons"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/registry/default/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"

import { useDataTableContext } from "./data-table-context"

function getPageItems(currentPage: number, pageCount: number) {
  const pages = new Set<number>([
    0,
    pageCount - 1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ])

  const items: Array<{ type: "page"; page: number } | { type: "ellipsis" }> = []

  for (let page = 0; page < pageCount; page++) {
    if (pages.has(page)) {
      items.push({ type: "page", page })
    } else if (
      items[items.length - 1] &&
      items[items.length - 1].type !== "ellipsis"
    ) {
      items.push({ type: "ellipsis" })
    }
  }

  return items
}

export function DataTablePagination({
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: {
  pageSizeOptions?: number[]
  className?: string
}) {
  const { table, rowCount } = useDataTableContext<unknown>()

  const state = table.getState().pagination
  const pageSize = state?.pageSize ?? pageSizeOptions[0]
  const pageIndex = state?.pageIndex ?? 0

  const filteredCount = table.getFilteredRowModel().rows.length
  const totalRows = rowCount !== undefined ? rowCount : filteredCount
  const pageCount = Math.max(table.getPageCount(), 1)

  const rangeStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, totalRows)

  const selectItems = pageSizeOptions.map((size) => ({
    label: String(size),
    value: String(size),
  }))

  const iconButtonClass = buttonVariants({
    variant: "link",
    size: "icon",
    className: "size-7",
  })

  return (
    <div
      data-slot="data-table-pagination"
      className={cn(
        "ms-auto flex flex-wrap items-center justify-end gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)]",
        className,
      )}
    >
      <div className="flex items-center gap-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)] text-[var(--hui-color-foreground-base-secondary)]">
        <span>Rows per page</span>
        <Select
          items={selectItems}
          value={String(pageSize)}
          onValueChange={(value) =>
            table.setPagination({
              pageIndex: 0,
              pageSize: Number(value),
            })
          }
        >
          <SelectTrigger size="sm" className="w-16" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span
        aria-live="polite"
        className="[font-size:var(--hui-font-size-small)] text-[var(--hui-color-foreground-base-secondary)] tabular-nums"
      >
        {rangeStart}-{rangeEnd} of {totalRows}
      </span>

      <Pagination className="mx-0 w-auto justify-end" aria-label="Table pagination">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              aria-label="Go to previous page"
              render={
                <button
                  type="button"
                  disabled={pageIndex === 0}
                  onClick={() => table.previousPage()}
                />
              }
              className={cn(iconButtonClass)}
            >
              <ChevronLeftIcon />
            </PaginationLink>
          </PaginationItem>

          {getPageItems(pageIndex, pageCount).map((item, index) =>
            item.type === "page" ? (
              <PaginationItem key={item.page}>
                <PaginationLink
                  isActive={item.page === pageIndex}
                  render={
                    <button
                      type="button"
                      onClick={() => table.setPageIndex(item.page)}
                    />
                  }
                  className={cn(
                    iconButtonClass,
                    "tabular-nums",
                    item.page === pageIndex
                      ? "text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-semibold)]"
                      : "text-[var(--hui-color-foreground-base-secondary)]"
                  )}
                >
                  {item.page + 1}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationLink
              aria-label="Go to next page"
              render={
                <button
                  type="button"
                  disabled={pageIndex >= pageCount - 1}
                  onClick={() => table.nextPage()}
                />
              }
              className={cn(iconButtonClass)}
            >
              <ChevronRightIcon />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
