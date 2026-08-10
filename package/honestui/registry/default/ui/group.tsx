import * as React from "react"
import { mergeProps } from "@base-ui-components/react/merge-props"
import { useRender } from "@base-ui-components/react/use-render"

import { cn } from "@/lib/utils"
import { Separator } from "@/registry/default/ui/separator"

function Group({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="group"
      className={cn(
        "isolate inline-flex w-fit items-stretch overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)] has-[[data-slot=input-control]:focus-within]:border-[var(--hui-color-border-accent-emphasis)] *:pointer-coarse:after:min-w-auto",
        className
      )}
      role="group"
      {...props}
    >
      {children}
    </div>
  )
}

function GroupItem({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    className: cn(
      "relative min-w-0 self-stretch rounded-none! border-0! shadow-none! focus-visible:z-10 focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset-border)] has-focus-visible:z-10 data-[slot=input-control]:bg-[var(--hui-color-background-base-primary)]",
      className
    ),
  }
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps(defaultProps, props),
  })
}

function GroupSeparator({ className, ...props }: { className?: string }) {
  return (
    <Separator
      orientation="vertical"
      className={cn(
        "relative z-20 self-stretch bg-[var(--hui-color-border-base-primary)] data-[orientation=vertical]:h-auto!",
        className
      )}
      {...props}
    />
  )
}

export { Group, GroupItem, GroupSeparator }
