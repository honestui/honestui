"use client"

import * as React from "react"
import {
  Combobox as ComboboxPrimitive,
  Select as SelectPrimitive,
} from "@base-ui/react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown as ChevronDownIcon } from "honestui/icons"

import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

type ItemType = {
  leadingIcon?: React.ReactNode
  children: React.ReactNode
  value: string
}

type ValueType = Omit<ItemType, "children"> & {
  children: React.ReactNode
}

type CommonProps = {
  autocomplete?: boolean
  autocompleteMode?: "auto" | "manual"
  searchValue?: string
  onSearch?: (value: string) => void
  defaultSearchValue?: string
}

type PrimitiveRootProps = Omit<
  SelectPrimitive.Root.Props<string, false>,
  | "children"
  | "defaultValue"
  | "items"
  | "multiple"
  | "onValueChange"
  | "value"
>

type BaseSelectProps = PrimitiveRootProps &
  CommonProps & {
    children?: React.ReactNode
    items?: unknown
  }

type SingleSelectProps = BaseSelectProps & {
  multiple?: false
  value?: string | null
  onValueChange?: (value: string | null) => void
  defaultValue?: string | null
}

type MultipleSelectProps = BaseSelectProps & {
  multiple: true
  value?: string[]
  onValueChange?: (value: string[]) => void
  defaultValue?: string[]
}

type SelectRootProps = SingleSelectProps | MultipleSelectProps

type SelectContextValue = CommonProps & {
  value?: string | string[] | null
  registerItem: (item: ItemType) => void
  unregisterItem: (value: string) => void
  multiple: boolean
  items: Record<string, ItemType>
  hasItems: boolean
}

type UseSelectContext = SelectContextValue & {
  shouldFilter: boolean
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
  undefined
)

function useSelectContext(): UseSelectContext {
  const context = React.useContext(SelectContext)

  if (!context) {
    throw new Error("Select components must be used within Select")
  }

  return {
    ...context,
    shouldFilter: Boolean(
      context.autocomplete &&
        context.autocompleteMode === "auto" &&
        context.searchValue?.length
    ),
  }
}

function normalizeItems(items: unknown): Record<string, ItemType> {
  const normalized: Record<string, ItemType> = {}

  function addItems(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach(addItems)
      return
    }

    if (typeof value === "string") {
      normalized[value] = { children: value, value }
      return
    }

    if (!value || typeof value !== "object" || React.isValidElement(value)) {
      return
    }

    const record = value as Record<string, unknown>

    if ("items" in record && Array.isArray(record.items)) {
      addItems(record.items)
      return
    }

    if ("value" in record) {
      const itemValue = record.value == null ? "" : String(record.value)
      normalized[itemValue] = {
        children:
          (record.label as React.ReactNode) ??
          (record.children as React.ReactNode) ??
          itemValue,
        leadingIcon: record.leadingIcon as React.ReactNode,
        value: itemValue,
      }
      return
    }

    Object.entries(record).forEach(([itemValue, label]) => {
      normalized[itemValue] = {
        children: label as React.ReactNode,
        value: itemValue,
      }
    })
  }

  addItems(items)
  return normalized
}

function SelectRoot(props: SelectRootProps) {
  const {
    children,
    value: providedValue,
    onValueChange,
    defaultValue,
    autocomplete,
    autocompleteMode = "auto",
    searchValue: providedSearchValue,
    onSearch,
    defaultSearchValue = "",
    open: providedOpen,
    defaultOpen = false,
    onOpenChange,
    multiple = false,
    items: itemsProp,
    ...rootProps
  } = props

  const [internalValue, setInternalValue] = React.useState<
    string | string[] | null | undefined
  >(defaultValue)
  const [internalSearchValue, setInternalSearchValue] =
    React.useState(defaultSearchValue)
  const [registeredItems, setRegisteredItems] = React.useState<
    Record<string, ItemType>
  >({})

  const computedValue =
    providedValue === undefined ? internalValue : providedValue
  const searchValue =
    providedSearchValue === undefined
      ? internalSearchValue
      : providedSearchValue

  const handleValueChange = React.useCallback(
    (nextValue: string | string[] | null) => {
      if (providedValue === undefined) {
        setInternalValue(nextValue)
      }

      if (multiple) {
        ;(onValueChange as MultipleSelectProps["onValueChange"])?.(
          nextValue as string[]
        )
      } else {
        ;(onValueChange as SingleSelectProps["onValueChange"])?.(
          nextValue as string | null
        )
      }
    },
    [multiple, onValueChange, providedValue]
  )

  const handleSearchValueChange = React.useCallback(
    (nextValue: string) => {
      if (providedSearchValue === undefined) {
        setInternalSearchValue(nextValue)
      }
      onSearch?.(nextValue)
    },
    [onSearch, providedSearchValue]
  )

  const registerItem = React.useCallback((item: ItemType) => {
    setRegisteredItems((currentItems) => ({
      ...currentItems,
      [item.value]: item,
    }))
  }, [])

  const unregisterItem = React.useCallback((value: string) => {
    setRegisteredItems((currentItems) => {
      const nextItems = { ...currentItems }
      delete nextItems[value]
      return nextItems
    })
  }, [])

  const normalizedItems = React.useMemo(
    () => normalizeItems(itemsProp),
    [itemsProp]
  )
  const items = React.useMemo(
    () => ({ ...normalizedItems, ...registeredItems }),
    [normalizedItems, registeredItems]
  )

  const contextValue = React.useMemo<SelectContextValue>(
    () => ({
      value: computedValue,
      registerItem,
      unregisterItem,
      autocomplete,
      autocompleteMode,
      searchValue,
      onSearch,
      defaultSearchValue,
      multiple,
      items,
      hasItems: itemsProp !== undefined,
    }),
    [
      autocomplete,
      autocompleteMode,
      computedValue,
      defaultSearchValue,
      items,
      itemsProp,
      multiple,
      onSearch,
      registerItem,
      searchValue,
      unregisterItem,
    ]
  )

  if (autocomplete) {
    const comboboxProps = {
      ...rootProps,
      value: providedValue,
      defaultValue,
      onValueChange: handleValueChange,
      inputValue: providedSearchValue,
      defaultInputValue: defaultSearchValue,
      onInputValueChange: handleSearchValueChange,
      open: providedOpen,
      defaultOpen,
      onOpenChange,
      multiple,
      modal: true,
      filter: itemsProp === undefined ? null : undefined,
      items: itemsProp,
      loopFocus: false,
      autoHighlight: true,
    } as ComboboxPrimitive.Root.Props<string, boolean>

    return (
      <SelectContext.Provider value={contextValue}>
        <ComboboxPrimitive.Root<string, boolean> {...comboboxProps}>
          {children}
        </ComboboxPrimitive.Root>
      </SelectContext.Provider>
    )
  }

  const selectProps = {
    ...rootProps,
    value: providedValue,
    defaultValue,
    onValueChange: handleValueChange,
    open: providedOpen,
    defaultOpen,
    onOpenChange,
    multiple,
    modal: true,
  } as SelectPrimitive.Root.Props<string, boolean>

  return (
    <SelectContext.Provider value={contextValue}>
      <SelectPrimitive.Root<string, boolean> {...selectProps}>
        {children}
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  )
}

SelectRoot.displayName = "Select"

const selectTriggerVariants = cva(
  "flex items-center justify-between rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] outline-none select-none [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] motion-safe:[transition:var(--hui-transition-interactive)] not-data-disabled:hover:cursor-pointer not-data-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] not-data-disabled:active:bg-[var(--hui-color-background-neutral-secondary)] focus:not-focus-visible:outline-none focus-visible:[outline:var(--hui-focus-ring)] data-disabled:pointer-events-none data-disabled:opacity-50 disabled:pointer-events-none disabled:opacity-50 data-[multiselectable=true]:py-[var(--hui-space-2)]",
  {
    variants: {
      size: {
        small:
          "min-h-[var(--hui-space-7)] overflow-hidden p-[var(--hui-space-2)]",
        medium:
          "min-h-[var(--hui-space-9)] overflow-hidden p-[var(--hui-space-3)]",
      },
      variant: {
        outline:
          "border-[0.5px] border-[var(--hui-color-border-base-tertiary)]",
        text: "border-0",
      },
    },
    defaultVariants: {
      size: "medium",
      variant: "outline",
    },
  }
)

type SelectTriggerProps = Omit<
  React.ComponentProps<"button">,
  "size"
> &
  Omit<VariantProps<typeof selectTriggerVariants>, "size"> & {
    size?: "sm" | "default" | "lg" | "small" | "medium"
    nativeButton?: boolean
  }

function SelectTrigger({
  ref,
  size = "medium",
  variant,
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: SelectTriggerProps) {
  const { multiple, autocomplete } = useSelectContext()
  const resolvedSize = size === "sm" || size === "small" ? "small" : "medium"
  const TriggerPrimitive = autocomplete
    ? ComboboxPrimitive.Trigger
    : SelectPrimitive.Trigger

  return (
    <TriggerPrimitive
      ref={ref}
      data-multiselectable={multiple ? true : undefined}
      data-size={resolvedSize}
      data-slot="select-trigger"
      data-variant={variant ?? "outline"}
      className={cn(
        selectTriggerVariants({ size: resolvedSize, variant }),
        className
      )}
      aria-label={ariaLabel || "Select option"}
      {...props}
    >
      <span
        className={cn(
          "flex flex-1 items-center overflow-hidden text-ellipsis whitespace-nowrap [font-style:normal] [font-weight:var(--hui-font-weight-medium)]",
          resolvedSize === "small"
            ? "gap-[var(--hui-space-1)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]"
            : "gap-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
        )}
        data-slot="select-trigger-content"
      >
        {children}
      </span>
      <ChevronDownIcon
        aria-hidden="true"
        className={cn(
          "shrink-0 text-[var(--hui-color-foreground-base-secondary)]",
          resolvedSize === "small"
            ? "ms-[var(--hui-space-2)] size-[var(--hui-space-4)]"
            : "ms-[var(--hui-space-3)] size-[var(--hui-space-5)]"
        )}
        data-slot="select-trigger-icon"
      />
    </TriggerPrimitive>
  )
}

SelectTrigger.displayName = "Select.Trigger"

type SelectValueProps = Omit<React.ComponentProps<"span">, "children"> & {
  placeholder?: string
  children?:
    | ((value?: ValueType | ValueType[]) => React.ReactNode)
    | React.ReactNode
}

function SelectValue({
  children,
  placeholder,
  className,
  ...props
}: SelectValueProps) {
  const { value, items, multiple } = useSelectContext()
  const placeholderContent = placeholder ?? items[""]?.children
  const hasValue = multiple
    ? Array.isArray(value) && value.length > 0
    : value !== undefined && value !== null && value !== ""

  const item = React.useMemo(() => {
    if (!hasValue) return undefined

    if (multiple && Array.isArray(value)) {
      return value.map(
        (itemValue) =>
          items[itemValue] ?? {
            children: itemValue,
            value: itemValue,
          }
      )
    }

    const itemValue = String(value)
    return (
      items[itemValue] ?? {
        children: itemValue,
        value: itemValue,
      }
    )
  }, [hasValue, items, multiple, value])

  if (!hasValue) {
    return (
      <span
        data-placeholder=""
        data-slot="select-value"
        className={cn(
          "text-[var(--hui-color-foreground-base-tertiary)]",
          className
        )}
        {...props}
      >
        {placeholderContent}
      </span>
    )
  }

  if (typeof children === "function") {
    return (
      <span data-slot="select-value" className={className} {...props}>
        {children(item)}
      </span>
    )
  }

  if (children) {
    return (
      <span data-slot="select-value" className={className} {...props}>
        {children}
      </span>
    )
  }

  if (Array.isArray(item)) {
    return <SelectMultipleValue data={item} />
  }

  return (
    <span data-slot="select-value" className={className} {...props}>
      <span
        className="flex h-full max-w-full flex-1 items-center gap-[var(--hui-space-3)] overflow-hidden text-ellipsis whitespace-nowrap in-data-[size=small]:gap-[var(--hui-space-2)]"
        data-slot="select-value-content"
      >
        {typeof item?.children === "string" && item.leadingIcon && (
          <span
            className="flex shrink-0 items-center justify-center [&_svg]:size-[var(--hui-space-5)] in-data-[size=small]:[&_svg]:size-[var(--hui-space-4)]"
            data-slot="select-value-icon"
          >
            {item.leadingIcon}
          </span>
        )}
        {item?.children ?? String(value)}
      </span>
    </span>
  )
}

SelectValue.displayName = "Select.Value"

function calculateTextWidth(text: string, fontSize = 11) {
  return text.length * fontSize * 0.6
}

function SelectMultipleValue({ data = [] }: { data: ItemType[] }) {
  const containerRef = React.useRef<HTMLSpanElement>(null)
  const [visibleCount, setVisibleCount] = React.useState(data.length)
  const [containerWidth, setContainerWidth] = React.useState(0)

  React.useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === "undefined") return

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setContainerWidth(Math.max(0, entry.contentRect.width - 70))
      })
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  React.useLayoutEffect(() => {
    if (!containerRef.current || data.length === 0 || containerWidth === 0) {
      return
    }

    const chipWidths = data.map((item) => {
      const text =
        typeof item.children === "string" ? item.children : item.value
      const iconWidth = item.leadingIcon ? 16 : 0
      return calculateTextWidth(text) + 8 + iconWidth
    })

    let totalWidth = chipWidths[0] ?? 0
    let count = data.length > 0 ? 1 : 0

    for (let index = 1; index < data.length; index += 1) {
      const newWidth = totalWidth + (chipWidths[index] ?? 0)
      if (newWidth > containerWidth) break
      count += 1
      totalWidth = newWidth
    }

    setVisibleCount(count)
  }, [containerWidth, data])

  return (
    <span
      ref={containerRef}
      className="flex h-full max-w-full flex-1 items-center gap-[var(--hui-space-2)] overflow-hidden whitespace-nowrap"
      data-slot="select-value"
    >
      {data.slice(0, visibleCount).map((item) => (
        <span
          key={item.value}
          className="inline-flex min-w-0 shrink-0 items-center gap-[var(--hui-space-1)] rounded-[var(--hui-radius-1)] bg-[var(--hui-color-background-neutral-secondary)] px-[var(--hui-space-2)] py-[var(--hui-space-1)] [font-size:var(--hui-font-size-mini)] [line-height:var(--hui-line-height-mini)]"
          data-slot="select-value-chip"
        >
          {item.leadingIcon && (
            <span className="flex size-[var(--hui-space-4)] items-center justify-center [&_svg]:size-full">
              {item.leadingIcon}
            </span>
          )}
          {typeof item.children === "string" ? item.children : item.value}
        </span>
      ))}
      {data.length > visibleCount && (
        <span
          className="shrink-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)]"
          data-slot="select-value-overflow"
        >
          +{data.length - visibleCount}
        </span>
      )}
    </span>
  )
}

type SelectContentProps = SelectPrimitive.Popup.Props & {
  searchPlaceholder?: string
  sideOffset?: SelectPrimitive.Positioner.Props["sideOffset"]
  side?: SelectPrimitive.Positioner.Props["side"]
  align?: SelectPrimitive.Positioner.Props["align"]
  alignItemWithTrigger?: SelectPrimitive.Positioner.Props["alignItemWithTrigger"]
}

function SelectContent({
  className,
  children,
  searchPlaceholder = "Search...",
  sideOffset = 4,
  side = "bottom",
  align = "start",
  alignItemWithTrigger = false,
  ...props
}: SelectContentProps) {
  const { autocomplete, multiple } = useSelectContext()
  const contentClassName = cn(
    "relative box-border max-h-[320px] min-w-(--anchor-width) origin-(--transform-origin) overflow-auto rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-soft)] [--apsara-select-padding:var(--hui-space-2)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] [transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out),transform_var(--hui-duration-fast)_var(--hui-ease-out)] motion-safe:data-ending-style:scale-[0.97] motion-safe:data-starting-style:scale-[0.97] has-[[data-slot=select-list]:empty]:[&_[data-slot=select-search]]:border-b-0 has-[[data-slot=select-list]:not(:has([data-slot=select-item]:not([data-hidden=true])))]:[&_[data-slot=select-search]]:border-b-0",
    className
  )

  if (autocomplete) {
    return (
      <ComboboxPrimitive.Portal keepMounted>
        <ComboboxPrimitive.Positioner
          sideOffset={sideOffset}
          side={side}
          align={align}
          className="z-[var(--hui-z-index-portal)]"
          data-slot="select-positioner"
        >
          <ComboboxPrimitive.Popup
            className={contentClassName}
            data-multiselectable={multiple ? true : undefined}
            data-slot="select-content"
            {...props}
          >
            <ComboboxPrimitive.Input
              placeholder={searchPlaceholder}
              className="sticky top-0 z-2 w-full rounded-t-[var(--hui-radius-2)] border-0 border-b-[0.5px] border-b-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] outline-none [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
              size={12}
              data-slot="select-search"
            />
            <ComboboxPrimitive.List
              className="p-[var(--apsara-select-padding)] empty:p-0 [&:not(:has([data-slot=select-item]:not([data-hidden=true])))]:p-0"
              data-slot="select-list"
            >
              {children}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    )
  }

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={sideOffset}
        side={side}
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        className="z-[var(--hui-z-index-portal)]"
        data-slot="select-positioner"
      >
        <SelectPrimitive.Popup
          className={contentClassName}
          data-multiselectable={multiple ? true : undefined}
          data-slot="select-content"
          {...props}
        >
          <SelectPrimitive.List
            className="p-[var(--apsara-select-padding)]"
            data-slot="select-list"
          >
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

SelectContent.displayName = "Select.Content"

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

type SelectItemProps = SelectPrimitive.Item.Props & {
  leadingIcon?: React.ReactNode
}

function SelectItem({
  className,
  children,
  value: providedValue,
  leadingIcon,
  disabled,
  ...props
}: SelectItemProps) {
  const value = providedValue == null ? "" : String(providedValue)
  const primitiveValue = providedValue == null ? null : value
  const {
    registerItem,
    unregisterItem,
    autocomplete,
    searchValue,
    value: selectValue,
    shouldFilter,
    hasItems,
    multiple,
  } = useSelectContext()

  const isSelected = multiple
    ? Array.isArray(selectValue) && selectValue.includes(value)
    : value === selectValue
  const searchableText = `${value} ${getTextContent(children)}`.toLowerCase()
  const isMatched = searchableText.includes((searchValue ?? "").toLowerCase())
  const isHidden = shouldFilter && !hasItems && isSelected && !isMatched

  React.useLayoutEffect(() => {
    registerItem({ leadingIcon, children, value })
    return () => unregisterItem(value)
  }, [children, leadingIcon, registerItem, unregisterItem, value])

  if (shouldFilter && !hasItems && !isMatched && !isSelected) {
    return null
  }

  const element =
    typeof children === "string" ? (
      <>
        {leadingIcon && (
          <span
            className="flex shrink-0 items-center justify-center [&_svg]:size-[var(--hui-space-5)]"
            data-slot="select-item-icon"
          >
            {leadingIcon}
          </span>
        )}
        <span data-slot="select-item-text">{children}</span>
      </>
    ) : (
      children
    )

  const itemClassName = cn(
    "relative flex items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] whitespace-normal outline-none [word-break:break-word] data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:cursor-pointer data-highlighted:bg-[var(--hui-color-background-base-primary-hover)] data-[hidden=true]:hidden",
    className
  )
  const renderItem = (
    renderProps: React.HTMLAttributes<HTMLDivElement>,
    state: { selected: boolean }
  ) => (
    <div {...renderProps}>
      {multiple && (
        <Checkbox
          checked={state.selected}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none"
        />
      )}
      {element}
    </div>
  )

  if (autocomplete) {
    return (
      <ComboboxPrimitive.Item
        value={primitiveValue}
        className={itemClassName}
        data-hidden={isHidden || undefined}
        data-slot="select-item"
        disabled={disabled || isHidden}
        {...props}
        render={renderItem}
      />
    )
  }

  return (
    <SelectPrimitive.Item
      value={primitiveValue}
      className={itemClassName}
      data-hidden={isHidden || undefined}
      data-slot="select-item"
      disabled={disabled || isHidden}
      {...props}
      render={renderItem}
    />
  )
}

SelectItem.displayName = "Select.Item"

type SelectGroupProps = SelectPrimitive.Group.Props

function SelectGroup({ className, children, ...props }: SelectGroupProps) {
  const { shouldFilter, autocomplete } = useSelectContext()

  if (shouldFilter) return <>{children}</>

  const GroupPrimitive = autocomplete
    ? ComboboxPrimitive.Group
    : SelectPrimitive.Group

  return (
    <GroupPrimitive
      className={className}
      data-slot="select-group"
      {...props}
    >
      {children}
    </GroupPrimitive>
  )
}

SelectGroup.displayName = "Select.Group"

type SelectLabelProps = SelectPrimitive.GroupLabel.Props

function SelectLabel({ className, ...props }: SelectLabelProps) {
  const { shouldFilter, autocomplete } = useSelectContext()

  if (shouldFilter) return null

  const LabelPrimitive = autocomplete
    ? ComboboxPrimitive.GroupLabel
    : SelectPrimitive.GroupLabel

  return (
    <LabelPrimitive
      className={cn(
        "px-[var(--hui-space-3)] py-[var(--hui-space-2)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)]",
        className
      )}
      data-slot="select-label"
      {...props}
    />
  )
}

SelectLabel.displayName = "Select.Label"

type SelectSeparatorProps = SelectPrimitive.Separator.Props

function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  const { shouldFilter, autocomplete } = useSelectContext()

  if (shouldFilter) return null

  const SeparatorPrimitive = autocomplete
    ? ComboboxPrimitive.Separator
    : SelectPrimitive.Separator

  return (
    <SeparatorPrimitive
      className={cn(
        "my-[var(--hui-space-2)] h-px bg-[var(--hui-color-border-base-primary)] [margin-inline:calc(var(--hui-space-3)*-1)]",
        className
      )}
      data-slot="select-separator"
      {...props}
    />
  )
}

SelectSeparator.displayName = "Select.Separator"

const Select = Object.assign(SelectRoot, {
  Group: SelectGroup,
  Value: SelectValue,
  ScrollUpArrow: SelectPrimitive.ScrollUpArrow,
  ScrollDownArrow: SelectPrimitive.ScrollDownArrow,
  List: SelectPrimitive.List,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Item: SelectItem,
  Separator: SelectSeparator,
  Label: SelectLabel,
})

const SelectPopup = SelectContent
const SelectGroupLabel = SelectLabel

export {
  Select,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectPopup,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectGroupLabel,
  SelectSeparator,
  type ItemType,
  type SelectContentProps,
  type SelectItemProps,
  type SelectRootProps,
  type SelectTriggerProps,
  type SelectValueProps,
}
