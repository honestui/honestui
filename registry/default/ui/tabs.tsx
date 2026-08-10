"use client"

import { Tabs as TabsPrimitive } from "@base-ui-components/react/tabs"

import { cn } from "@/lib/utils"

type TabsSize = "small" | "medium" | "large" | "regular"
type TabsVariant = "default" | "underline" | "standalone" | "plain"

function Tabs({
  size = "large",
  className,
  ...props
}: TabsPrimitive.Root.Props & { size?: TabsSize }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn(
        "flex w-full flex-col [--tabs-trigger-font-size:var(--hui-font-size-regular)] [--tabs-trigger-height:var(--hui-space-8)] [--tabs-trigger-letter-spacing:var(--hui-letter-spacing-regular)] [--tabs-trigger-line-height:var(--hui-line-height-regular)] [--tabs-trigger-padding-inline:var(--hui-space-3)] data-[orientation=vertical]:flex-row",
        size === "small" &&
          "[--tabs-trigger-font-size:var(--hui-font-size-mini)] [--tabs-trigger-height:var(--hui-space-6)] [--tabs-trigger-letter-spacing:var(--hui-letter-spacing-mini)] [--tabs-trigger-line-height:var(--hui-line-height-mini)] [--tabs-trigger-padding-inline:var(--hui-space-2)]",
        size === "medium" &&
          "[--tabs-trigger-font-size:var(--hui-font-size-small)] [--tabs-trigger-height:var(--hui-space-7)] [--tabs-trigger-letter-spacing:var(--hui-letter-spacing-small)] [--tabs-trigger-line-height:var(--hui-line-height-small)] [--tabs-trigger-padding-inline:var(--hui-space-3)]",
        className
      )}
      {...props}
    />
  )
}

function TabsList({
  variant = "default",
  indicatorClassName,
  className,
  children,
  ...props
}: TabsPrimitive.List.Props & {
  variant?: TabsVariant
  indicatorClassName?: string
}) {
  const resolvedVariant = variant === "underline" ? "plain" : variant

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "relative flex w-full items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-neutral-secondary)] p-[var(--hui-space-1)] shadow-[var(--hui-shadow-inset)] data-[orientation=vertical]:w-fit data-[orientation=vertical]:flex-col",
        resolvedVariant === "standalone" &&
          "bg-transparent shadow-none [&>[data-slot=tabs-trigger]]:border-[0.5px] [&>[data-slot=tabs-trigger]]:border-[var(--hui-color-border-base-primary)] [&>[data-slot=tabs-trigger][data-active]]:border-transparent",
        resolvedVariant === "plain" &&
          "justify-center gap-[var(--hui-space-6)] rounded-none bg-transparent p-0 shadow-none [&>[data-slot=tabs-trigger]]:flex-none [&>[data-slot=tabs-trigger]]:rounded-none [&>[data-slot=tabs-trigger]]:border-b [&>[data-slot=tabs-trigger]]:border-b-transparent",
        className
      )}
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        data-slot="tab-indicator"
        className={cn(
          "absolute top-0 left-0 z-0 h-[var(--active-tab-height,0)] w-[var(--active-tab-width,0)] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)] [translate:var(--active-tab-left,0)_var(--active-tab-top,0)] motion-safe:transition-[translate,width,height] motion-safe:duration-[var(--hui-duration-moderate)] motion-safe:ease-[var(--hui-ease-in-out)]",
          resolvedVariant === "standalone" &&
            "box-border border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-neutral-primary)] shadow-none",
          resolvedVariant === "plain" &&
            "rounded-none bg-[var(--hui-color-border-base-emphasis)] shadow-none data-[orientation=horizontal]:h-px data-[orientation=horizontal]:[translate:var(--active-tab-left,0px)_calc(var(--active-tab-top,0px)+var(--active-tab-height,0px)-1px)] data-[orientation=vertical]:w-px data-[orientation=vertical]:[translate:calc(var(--active-tab-left,0px)+var(--active-tab-width,0px)-1px)_var(--active-tab-top,0px)]",
          indicatorClassName
        )}
      />
    </TabsPrimitive.List>
  )
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative z-1 m-0 box-border inline-flex h-[var(--tabs-trigger-height)] flex-1 cursor-pointer items-center justify-center gap-[var(--hui-space-2)] overflow-hidden rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--tabs-trigger-padding-inline)] text-center text-ellipsis whitespace-nowrap text-[var(--hui-color-foreground-base-secondary)] outline-none [font-size:var(--tabs-trigger-font-size)] [font-style:normal] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--tabs-trigger-letter-spacing)] [line-height:var(--tabs-trigger-line-height)] transition-colors duration-[var(--hui-duration-normal)] ease-[var(--hui-ease-out)] data-active:text-[var(--hui-color-foreground-base-primary)] data-disabled:pointer-events-none data-disabled:opacity-50 [&:focus-visible]:[outline:var(--hui-focus-ring)] [&:hover:not([data-disabled])]:text-[var(--hui-color-foreground-base-primary)] [&:active:not([data-disabled]):not([data-active])]:scale-[var(--hui-scale-pressed)] motion-safe:transition-[color,transform] motion-safe:duration-[var(--hui-duration-normal),var(--hui-duration-press)] motion-safe:[transition-timing-function:var(--hui-ease-out)] [&_svg]:pointer-events-none [&_svg]:size-[var(--hui-space-5)] [&_svg]:shrink-0 [&_svg]:text-current",
        "data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start",
        className
      )}
      {...props}
    />
  )
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

export {
  Tabs,
  TabsList,
  TabsTab,
  TabsTab as TabsTrigger,
  TabsPanel,
  TabsPanel as TabsContent
}
