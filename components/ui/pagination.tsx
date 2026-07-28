import * as React from "react"
import { mergeProps } from "@base-ui-components/react/merge-props"
import { useRender } from "@base-ui-components/react/use-render"
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Ellipsis as MoreHorizontalIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn(
        "m-0 flex list-none flex-row items-center gap-1 p-0",
        className
      )}
      {...props}
    />
  )
}

function PaginationItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("list-none", className)}
      {...props}
    />
  )
}

type PaginationLinkProps = {
  isActive?: boolean
  size?: React.ComponentProps<typeof Button>["size"]
} & useRender.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  render,
  ...props
}: PaginationLinkProps) {
  const defaultProps = {
    "aria-current": isActive ? ("page" as const) : undefined,
    "data-slot": "pagination-link",
    "data-active": isActive,
    className: render
      ? className
      : cn(
          buttonVariants({
            variant: isActive ? "outline" : "ghost",
            size,
          }),
          className
        ),
  }

  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(defaultProps, props),
  })
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("max-sm:aspect-square max-sm:p-0", className)}
      {...props}
    >
      <ChevronLeftIcon className="sm:-ms-1" />
      <span className="max-sm:hidden">Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("max-sm:aspect-square max-sm:p-0", className)}
      {...props}
    >
      <span className="max-sm:hidden">Next</span>
      <ChevronRightIcon className="sm:-me-1" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex min-w-7 justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
