"use client"

import * as React from "react"
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/registry/default/ui/button"
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

import { useDataGridContext } from "./data-grid-context"
import { getDataGridPageItems } from "./data-grid-utils"

export function DataGridPagination({
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: {
  pageSizeOptions?: number[]
  className?: string
}) {
  const { table, rowCount } = useDataGridContext<unknown>()
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = rowCount ?? table.getFilteredRowModel().rows.length
  const pageCount = Math.max(table.getPageCount(), 1)
  const rangeStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, totalRows)
  const pageSizeItems = pageSizeOptions.map((size) => ({
    label: String(size),
    value: String(size),
  }))
  const pageButtonClass = buttonVariants({
    variant: "link",
    size: "icon",
    className: "size-7",
  })

  return (
    <div
      data-slot="data-grid-pagination"
      className={cn(
        "ms-auto flex min-w-0 flex-wrap items-center justify-end gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)]",
        className,
      )}
    >
      <div className="flex items-center gap-[var(--hui-space-2)] whitespace-nowrap [font-size:var(--hui-font-size-small)] text-[var(--hui-color-foreground-base-secondary)]">
        <span>Rows per page</span>
        <Select
          items={pageSizeItems}
          value={String(pageSize)}
          onValueChange={(value) =>
            table.setPagination({ pageIndex: 0, pageSize: Number(value) })
          }
        >
          <SelectTrigger size="sm" className="w-16" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span
        role="status"
        aria-live="polite"
        className="whitespace-nowrap tabular-nums [font-size:var(--hui-font-size-small)] text-[var(--hui-color-foreground-base-secondary)]"
      >
        {rangeStart} to {rangeEnd} of {totalRows}
      </span>

      <Pagination className="mx-0 w-auto justify-end" aria-label="Data grid pagination">
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
              className={pageButtonClass}
            >
              <ChevronLeftIcon aria-hidden />
            </PaginationLink>
          </PaginationItem>
          {getDataGridPageItems(pageIndex, pageCount).map((item, index) =>
            item.type === "page" ? (
              <PaginationItem key={item.page}>
                <PaginationLink
                  isActive={item.page === pageIndex}
                  aria-label={`Go to page ${item.page + 1}`}
                  render={<button type="button" onClick={() => table.setPageIndex(item.page)} />}
                  className={cn(pageButtonClass, "tabular-nums")}
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
              className={pageButtonClass}
            >
              <ChevronRightIcon aria-hidden />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
