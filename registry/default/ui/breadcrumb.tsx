import * as React from "react"
import { mergeProps } from "@base-ui-components/react/merge-props"
import { useRender } from "@base-ui-components/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronRight, Ellipsis as MoreHorizontal } from "honestui/icons"

import { cn } from "@/lib/utils"

const breadcrumbVariants = cva("[font-weight:var(--hui-font-weight-medium)]", {
  variants: {
    size: {
      small:
        "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
      medium:
        "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]",
    },
  },
  defaultVariants: {
    size: "medium",
  },
})

interface BreadcrumbProps extends React.ComponentProps<"nav"> {
  size?: VariantProps<typeof breadcrumbVariants>["size"]
}

function Breadcrumb({ className, size, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn(breadcrumbVariants({ size }), className)}
      {...props}
    />
  )
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "m-0 flex list-none items-center gap-[var(--hui-space-2)] p-0",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("flex items-center whitespace-nowrap", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  const defaultProps = {
    "data-slot": "breadcrumb-link",
    className: cn(
      "flex cursor-pointer items-center gap-[var(--hui-space-2)] whitespace-nowrap text-[var(--hui-color-foreground-base-tertiary)] no-underline outline-none motion-safe:[transition:color_var(--hui-duration-fast)_var(--hui-ease-out)] hover:text-[var(--hui-color-foreground-base-secondary)] focus-visible:rounded-[var(--hui-radius-1)] focus-visible:[outline:var(--hui-focus-ring)] aria-disabled:pointer-events-none aria-disabled:opacity-50",
      className
    ),
  }

  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(defaultProps, props),
  })
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(
        "flex cursor-default items-center whitespace-nowrap text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)] hover:text-[var(--hui-color-foreground-base-primary)]",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex items-center text-[var(--hui-color-foreground-base-tertiary)] [&>svg]:size-4",
        className
      )}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex items-center text-[var(--hui-color-foreground-base-tertiary)]",
        className
      )}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

function BreadcrumbIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-icon"
      className={cn("flex items-center", className)}
      {...props}
    />
  )
}

function BreadcrumbDropdownTrigger({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button">) {
  const defaultProps = {
    "data-slot": "breadcrumb-dropdown-trigger",
    type: "button" as const,
    className: cn(
      "flex cursor-pointer items-center border-0 bg-transparent p-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:inherit] [font-weight:inherit] outline-none focus-visible:rounded-[var(--hui-radius-1)] focus-visible:[outline:var(--hui-focus-ring)] [&_svg]:h-[var(--hui-space-3)]",
      className
    ),
  }

  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(defaultProps, props),
  })
}

function BreadcrumbDropdownItem({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  const defaultProps = {
    "data-slot": "breadcrumb-dropdown-item",
    className: cn(
      "block w-full cursor-pointer border-0 bg-transparent p-[var(--hui-space-3)] text-left text-[var(--hui-color-foreground-base-primary)] no-underline [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] hover:rounded-[var(--hui-radius-2)] hover:bg-[var(--hui-color-background-base-primary-hover)]",
      className
    ),
  }

  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(defaultProps, props),
  })
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  BreadcrumbIcon,
  BreadcrumbDropdownTrigger,
  BreadcrumbDropdownItem,
  breadcrumbVariants,
}
