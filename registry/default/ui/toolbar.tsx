"use client"

import { Toolbar as ToolbarPrimitive } from "@base-ui-components/react/toolbar"

import { cn } from "@/lib/utils"

function Toolbar({ className, ...props }: ToolbarPrimitive.Root.Props) {
  return (
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      className={cn(
        "flex items-center gap-[var(--hui-space-1)] overflow-clip rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] p-[var(--hui-space-1)] data-[orientation=vertical]:flex-col data-[orientation=vertical]:[&_[data-slot=toolbar-button]]:w-full data-[orientation=vertical]:[&_[data-slot=toolbar-group]]:flex-col [&>*]:border-0",
        className
      )}
      {...props}
    />
  )
}

function ToolbarButton({ className, ...props }: ToolbarPrimitive.Button.Props) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      className={cn(className)}
      {...props}
    />
  )
}

function ToolbarLink({ className, ...props }: ToolbarPrimitive.Link.Props) {
  return (
    <ToolbarPrimitive.Link
      data-slot="toolbar-link"
      className={cn(className)}
      {...props}
    />
  )
}

function ToolbarInput({ className, ...props }: ToolbarPrimitive.Input.Props) {
  return (
    <ToolbarPrimitive.Input
      data-slot="toolbar-input"
      className={cn(className)}
      {...props}
    />
  )
}

function ToolbarGroup({ className, ...props }: ToolbarPrimitive.Group.Props) {
  return (
    <ToolbarPrimitive.Group
      data-slot="toolbar-group"
      className={cn(
        "flex items-center gap-[var(--hui-space-1)] bg-transparent p-0 [&>*]:border-0",
        className
      )}
      {...props}
    />
  )
}

function ToolbarSeparator({
  className,
  ...props
}: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn(
        "shrink-0 bg-[var(--hui-color-border-base-primary)] data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-[calc(100%-var(--hui-space-3))] data-[orientation=vertical]:h-[var(--hui-space-5)] data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarButton,
  ToolbarLink,
  ToolbarInput,
}
