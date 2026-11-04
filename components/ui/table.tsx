import * as React from "react"
import type { ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      {/* No table-wide tabular-nums: in Love Sans it also widens spaces and
          punctuation to figure width. Apply it to numeric cells only. */}
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom border-collapse overflow-visible text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]",
          className
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "sticky top-0 z-1 m-0 bg-[var(--hui-color-background-base-primary)]",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: ComponentPropsWithoutRef<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&>tr:last-child>*]:border-b-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: ComponentPropsWithoutRef<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "[&>tr:last-child>*]:border-b-0 [&>tr:first-child>*]:border-t-[0.5px] [&>tr:first-child>*]:border-[var(--hui-color-border-base-primary)] [&>tr>*]:text-[var(--hui-color-foreground-base-primary)] [&>tr>*]:[font-weight:var(--hui-font-weight-medium)]",
        className
      )}
      {...props}
    />
  )
}

function TableRow({
  className,
  ...props
}: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "h-[var(--hui-density-row-min-height,auto)] bg-[var(--hui-color-background-base-primary)] motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out)] in-data-[slot=table-body]:hover:bg-[var(--hui-color-background-base-secondary)] data-[state=selected]:bg-[var(--hui-color-background-accent-primary)] data-[state=selected]:hover:bg-[var(--hui-color-background-accent-primary)] data-[state=selected]:active:bg-[var(--hui-color-background-accent-primary)]",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "border-b-[0.5px] border-[var(--hui-color-border-base-primary)] bg-inherit px-[var(--hui-density-cell-padding-inline,var(--hui-space-3))] py-[var(--hui-density-header-padding-block,var(--hui-space-3))] text-start align-middle text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [font-style:normal] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] [&[scope=row]]:[font-size:var(--hui-font-size-table-row-head,var(--hui-font-size-small))] [&[scope=row]]:[line-height:var(--hui-line-height-table-row-head,var(--hui-line-height-small))]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: ComponentPropsWithoutRef<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "border-b-[0.5px] border-[var(--hui-color-border-base-primary)] bg-inherit px-[var(--hui-density-cell-padding-inline,var(--hui-space-3))] py-[var(--hui-density-cell-padding-block,var(--hui-space-4))] whitespace-normal [overflow-wrap:anywhere] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-regular)] [font-style:normal] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]",
        className
      )}
      {...props}
    />
  )
}

function TableSectionHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      data-slot="table-section-header"
      className={cn(
        "bg-[var(--hui-color-background-neutral-primary)] text-start [&>th]:bg-inherit [&>th]:p-[var(--hui-space-3)] [&>th]:text-[var(--hui-color-foreground-base-primary)] [&>th]:[font-size:var(--hui-font-size-small)] [&>th]:[font-style:normal] [&>th]:[font-weight:var(--hui-font-weight-medium)] [&>th]:[letter-spacing:var(--hui-letter-spacing-small)] [&>th]:[line-height:var(--hui-line-height-small)]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: ComponentPropsWithoutRef<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "mt-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]",
        className
      )}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableSectionHeader,
  TableCell,
  TableCaption,
}
