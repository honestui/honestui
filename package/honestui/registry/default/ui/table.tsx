import * as React from "react"
import type { ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom border-collapse overflow-visible text-[var(--hui-color-foreground-base-primary)] tabular-nums [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]",
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
      className={className}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: ComponentPropsWithoutRef<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={className}
      {...props}
    />
  )
}

function TableRow({
  className,
  interactive = false,
  ...props
}: ComponentPropsWithoutRef<"tr"> & { interactive?: boolean }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "bg-[var(--hui-color-background-base-primary)] [&>[data-slot=table-cell]]:bg-inherit data-[state=selected]:bg-[var(--hui-color-background-accent-primary)] data-[state=selected]:hover:bg-[var(--hui-color-background-accent-primary)] data-[state=selected]:active:bg-[var(--hui-color-background-accent-primary)]",
        interactive &&
          "cursor-pointer hover:bg-[var(--hui-color-background-base-primary-hover)] active:bg-[var(--hui-color-background-neutral-secondary)]",
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
        "border-b-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-3)] text-left align-middle text-[var(--hui-color-foreground-base-tertiary)] [font-size:var(--hui-font-size-small)] [font-style:normal] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
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
        "overflow-hidden border-b-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-3)] py-[var(--hui-space-4)] text-ellipsis whitespace-nowrap text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-regular)] [font-style:normal] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]",
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
        "bg-[var(--hui-color-background-neutral-primary)] text-left [&>th]:bg-inherit [&>th]:p-[var(--hui-space-3)] [&>th]:text-[var(--hui-color-foreground-base-primary)] [&>th]:[font-size:var(--hui-font-size-small)] [&>th]:[font-style:normal] [&>th]:[font-weight:var(--hui-font-weight-medium)] [&>th]:[letter-spacing:var(--hui-letter-spacing-small)] [&>th]:[line-height:var(--hui-line-height-small)]",
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
