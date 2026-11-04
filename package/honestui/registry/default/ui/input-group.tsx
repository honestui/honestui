"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Textarea } from "./textarea"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-hui=""
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex h-[var(--hui-density-control-height,36px)] w-full min-w-0 items-center rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] has-[[data-slot=input-group-control]:read-only]:bg-[var(--hui-color-background-base-secondary)] motion-safe:[transition:var(--hui-transition-interactive)] not-has-[[data-slot=input-group-control]:is(:disabled,:focus,:read-only,[data-invalid],[aria-invalid=true])]:hover:border-[var(--hui-color-border-field-hover,var(--hui-color-border-field,var(--hui-color-border-base-tertiary)))] has-[[data-slot=input-group-control]:disabled]:border-[var(--hui-color-border-base-primary)] outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:outline-none has-[[data-slot=input-group-control]:disabled]:bg-[var(--hui-color-background-base-secondary)] has-[[data-slot=input-group-control]:focus]:border-[var(--hui-color-border-accent-emphasis)] has-[[data-slot=input-group-control]:focus]:outline-2 has-[[data-slot=input-group-control]:focus]:outline-solid has-[[data-slot=input-group-control]:focus]:outline-transparent has-[[data-slot=input-group-control]:focus]:shadow-[var(--hui-focus-ring-field)] has-[[data-slot=input-group-control]:focus]:outline-offset-[var(--hui-focus-ring-offset-inset-border)] has-[[data-slot=input-group-control]:is([data-invalid],[aria-invalid=true])]:border-[var(--hui-color-border-danger-emphasis)] has-[[data-slot=input-group-control]:is([data-invalid],[aria-invalid=true]):focus]:border-[var(--hui-color-border-danger-emphasis-hover)] has-[[data-slot=input-group-control]:is([data-invalid],[aria-invalid=true]):focus]:shadow-[var(--hui-focus-ring-field-danger)] has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto has-[>[data-align=block-end]]:[&_input[data-slot=input-group-control]]:pt-3 has-[>[data-align=block-start]]:[&_input[data-slot=input-group-control]]:pb-3 has-[>[data-align=inline-end]]:[&_input[data-slot=input-group-control]]:pe-1.5 has-[>[data-align=inline-start]]:[&_input[data-slot=input-group-control]]:ps-1.5",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] font-medium text-[var(--hui-color-foreground-base-secondary)] select-none group-has-[[data-slot=input-group-control]:disabled]/input-group:text-[var(--hui-color-foreground-base-tertiary)] [&>kbd]:rounded-[calc(var(--hui-radius-2)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first ps-2 has-[>button]:-ms-[0.3rem] has-[>kbd]:-ms-[0.15rem]",
        "inline-end":
          "order-last pe-2 has-[>button]:-me-[0.3rem] has-[>kbd]:-me-[0.15rem]",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  onClick,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || (e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector<HTMLElement>("input, textarea")?.focus()
      }}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva(
  "flex min-h-0 items-center gap-2 [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] shadow-none",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 rounded-[calc(var(--hui-radius-2)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 px-2.5",
        "icon-xs":
          "size-6 rounded-[calc(var(--hui-radius-2)-3px)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
  VariantProps<typeof inputGroupButtonVariants> & {
    type?: "button" | "submit" | "reset"
  }) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] text-[var(--hui-color-foreground-base-secondary)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "h-full min-h-0 flex-1 rounded-none border-0 bg-transparent shadow-none [&_input]:h-full focus-within:bg-transparent focus-within:outline-none focus-within:shadow-none! data-disabled:bg-transparent has-[input[data-disabled]]:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none [&:focus:not(:disabled)]:bg-transparent [&:focus:not(:disabled)]:outline-none [&:focus:not(:disabled)]:shadow-none! disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
