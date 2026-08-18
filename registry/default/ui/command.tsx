"use client"

import * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"

type CommandContextValue = {
  inputValue: string
  usesItemsProp: boolean
}

const CommandContext = React.createContext<CommandContextValue | null>(null)

function useCommandContext() {
  const context = React.useContext(CommandContext)

  if (!context) {
    throw new Error("Command parts must be used within Command")
  }

  return context
}

function getTextContent(node: React.ReactNode): string {
  return React.Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child)
      }

      if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
        return getTextContent(child.props.children)
      }

      return ""
    })
    .join(" ")
}

function matchesSearch(
  value: unknown,
  children: React.ReactNode,
  query: string
) {
  const searchableValue =
    typeof value === "string" ? value : getTextContent(children)

  return searchableValue
    .toLocaleLowerCase()
    .includes(query.trim().toLocaleLowerCase())
}

type CommandProps<ItemValue = string> = Omit<
  AutocompletePrimitive.Root.Props<ItemValue>,
  "items"
> & {
  className?: string
  items?: readonly ItemValue[]
}

function Command<ItemValue = string>({
  value: controlledValue,
  defaultValue,
  onValueChange,
  items,
  inline = true,
  open = true,
  autoHighlight = "always",
  keepHighlight = true,
  className,
  children,
  ...props
}: CommandProps<ItemValue>) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    typeof defaultValue === "string" ? defaultValue : ""
  )
  const inputValue =
    typeof controlledValue === "string" ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback<
    NonNullable<AutocompletePrimitive.Root.Props<ItemValue>["onValueChange"]>
  >(
    (nextValue, eventDetails) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(nextValue)
      }
      onValueChange?.(nextValue, eventDetails)
    },
    [controlledValue, onValueChange]
  )

  const context = React.useMemo<CommandContextValue>(
    () => ({
      inputValue,
      usesItemsProp: items !== undefined,
    }),
    [inputValue, items]
  )

  return (
    <CommandContext.Provider value={context}>
      <AutocompletePrimitive.Root<ItemValue>
        inline={inline}
        open={open}
        autoHighlight={autoHighlight}
        keepHighlight={keepHighlight}
        value={controlledValue}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        items={items}
        {...props}
      >
        <div
          data-slot="command"
          className={cn(
            "isolate flex w-full flex-col overflow-hidden bg-[var(--hui-color-background-base-primary)]",
            className
          )}
        >
          {children}
        </div>
      </AutocompletePrimitive.Root>
    </CommandContext.Provider>
  )
}

type CommandInputProps = Omit<AutocompletePrimitive.Input.Props, "size"> & {
  leadingIcon?: React.ReactNode
  size?: "sm" | "default" | "lg"
}

function CommandInput({
  className,
  leadingIcon,
  size = "lg",
  placeholder = "Search...",
  autoFocus = true,
  "aria-label": ariaLabel = "Search commands",
  ...props
}: CommandInputProps) {
  return (
    <div
      data-slot="command-input-container"
      className="flex flex-col bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-2)]"
    >
      <div className="flex items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-3)] shadow-none outline-none focus-within:bg-[var(--hui-color-background-base-primary-hover)] forced-colors:focus-within:outline forced-colors:focus-within:outline-1 forced-colors:focus-within:outline-offset-[-2px]">
        {leadingIcon ? (
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center text-[var(--hui-color-foreground-base-secondary)] [&_svg]:size-[var(--hui-space-5)]"
          >
            {leadingIcon}
          </span>
        ) : null}
        <AutocompletePrimitive.Input
          data-slot="command-input"
          type="search"
          aria-label={ariaLabel}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={cn(
            "m-0 w-full min-w-0 border-0 bg-transparent p-0 text-[var(--hui-color-foreground-base-primary)] shadow-none outline-none [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] placeholder:text-[var(--hui-color-foreground-base-tertiary)] focus-visible:ring-0 focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
            size === "sm" && "h-[var(--hui-space-7)]",
            size === "default" && "h-[var(--hui-space-9)]",
            size === "lg" && "h-[var(--hui-space-11)]",
            className
          )}
          {...props}
        />
      </div>
    </div>
  )
}

type CommandContentProps = AutocompletePrimitive.List.Props

function CommandContent({ className, ...props }: CommandContentProps) {
  return (
    <AutocompletePrimitive.List
      data-slot="command-content"
      className={cn(
        "flex max-h-80 flex-col overflow-x-hidden overflow-y-auto overscroll-contain px-[var(--hui-space-2)] empty:p-0 [&:has([role=option])>[data-slot=command-empty]]:hidden [&:not(:has([data-slot=command-group]))]:gap-[var(--hui-space-1)] [&:not(:has([data-slot=command-group]))]:py-[var(--hui-space-3)]",
        className
      )}
      {...props}
    />
  )
}

type CommandItemProps = AutocompletePrimitive.Item.Props & {
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

function CommandItem({
  className,
  children,
  value: providedValue,
  leadingIcon,
  trailingIcon,
  ...props
}: CommandItemProps) {
  const { inputValue, usesItemsProp } = useCommandContext()
  const value =
    providedValue !== undefined
      ? providedValue
      : typeof children === "string"
        ? children
        : undefined

  if (
    !usesItemsProp &&
    inputValue &&
    !matchesSearch(value, children, inputValue)
  ) {
    return null
  }

  return (
    <AutocompletePrimitive.Item
      data-slot="command-item"
      value={value}
      className={cn(
        "flex min-h-9 cursor-pointer scroll-my-[var(--hui-space-2)] items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] outline-none select-none [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-[var(--hui-color-background-base-primary-hover)]",
        className
      )}
      {...props}
    >
      {leadingIcon ? (
        <span
          data-slot="command-item-leading-icon"
          aria-hidden="true"
          className="inline-flex shrink-0 items-center justify-center text-[var(--hui-color-foreground-base-secondary)] [&_svg]:size-[var(--hui-space-5)]"
        >
          {leadingIcon}
        </span>
      ) : null}
      <span
        data-slot="command-item-label"
        className="min-w-0 flex-1 truncate"
      >
        {children}
      </span>
      {trailingIcon ? (
        <span
          data-slot="command-item-trailing-icon"
          className="ms-auto inline-flex shrink-0 items-center justify-center text-[var(--hui-color-foreground-base-tertiary)] [&_svg]:size-[var(--hui-space-5)]"
        >
          {trailingIcon}
        </span>
      ) : null}
    </AutocompletePrimitive.Item>
  )
}

type CommandEmptyProps = React.ComponentProps<"div">

function CommandEmpty({ className, ...props }: CommandEmptyProps) {
  return (
    <div
      data-slot="command-empty"
      className={cn(
        "px-[var(--hui-space-3)] py-[var(--hui-space-7)] text-center text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]",
        className
      )}
      {...props}
    />
  )
}

type CommandGroupProps = AutocompletePrimitive.Group.Props

function CommandGroup({ children, className, ...props }: CommandGroupProps) {
  const { inputValue, usesItemsProp } = useCommandContext()

  if (!usesItemsProp && inputValue) return <>{children}</>

  return (
    <AutocompletePrimitive.Group
      data-slot="command-group"
      className={cn(
        "flex flex-col gap-[var(--hui-space-1)] py-[var(--hui-space-3)]",
        className
      )}
      {...props}
    >
      {children}
    </AutocompletePrimitive.Group>
  )
}

type CommandLabelProps = AutocompletePrimitive.GroupLabel.Props

function CommandLabel({ className, ...props }: CommandLabelProps) {
  const { inputValue, usesItemsProp } = useCommandContext()

  if (!usesItemsProp && inputValue) return null

  return (
    <AutocompletePrimitive.GroupLabel
      data-slot="command-label"
      className={cn(
        "flex items-center px-[var(--hui-space-3)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-tertiary)] [font-size:var(--hui-font-size-micro)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-micro)] [line-height:var(--hui-line-height-micro)]",
        className
      )}
      {...props}
    />
  )
}

type CommandSeparatorProps = AutocompletePrimitive.Separator.Props

function CommandSeparator({ className, ...props }: CommandSeparatorProps) {
  const { inputValue, usesItemsProp } = useCommandContext()

  if (!usesItemsProp && inputValue) return null

  return (
    <AutocompletePrimitive.Separator
      data-slot="command-separator"
      className={cn(
        "my-[var(--hui-space-1)] h-px bg-[var(--hui-color-border-base-primary)]",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />
}

function CommandDialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return (
    <DialogPrimitive.Trigger data-slot="command-dialog-trigger" {...props} />
  )
}

type CommandDialogContentProps = DialogPrimitive.Popup.Props & {
  title?: string
  width?: React.CSSProperties["width"]
}

function CommandDialogContent({
  className,
  children,
  title = "Command palette",
  width,
  style,
  ...props
}: CommandDialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Viewport
        data-slot="command-dialog-viewport"
        className="pointer-events-none fixed inset-0 z-[var(--hui-z-index-portal)]"
      >
        <DialogPrimitive.Popup
          data-slot="command-dialog-content"
          className={cn(
            "pointer-events-auto fixed top-0 left-1/2 isolate flex max-h-[min(420px,80vh)] min-h-0 w-[540px] max-w-[90vw] flex-col overflow-hidden rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-floating)] [transform:translate(-50%,min(160px,calc(50vh-50%)))] outline-none motion-safe:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out)] motion-safe:data-ending-style:opacity-0 motion-safe:data-starting-style:opacity-0",
            className
          )}
          style={{ width, ...style }}
          {...props}
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  )
}

export {
  Command,
  CommandContent,
  CommandDialog,
  CommandDialogContent,
  CommandDialogTrigger,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandLabel,
  CommandSeparator,
}

export type {
  CommandContentProps,
  CommandDialogContentProps,
  CommandEmptyProps,
  CommandGroupProps,
  CommandInputProps,
  CommandItemProps,
  CommandLabelProps,
  CommandProps,
  CommandSeparatorProps,
}
