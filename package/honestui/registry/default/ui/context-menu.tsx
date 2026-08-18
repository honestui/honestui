"use client"

import * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"
import { ChevronRight as ChevronRightIcon } from "honestui/icons"

import { cn } from "@/lib/utils"

type AutocompleteMode = "auto" | "manual"

type ContextMenuContextValue = {
  autocomplete: boolean
  autocompleteMode: AutocompleteMode
  inputRef: React.RefObject<HTMLInputElement | null>
  inputValue: string
  isInitialRenderRef: React.RefObject<boolean>
  onInputValueChange: (value: string) => void
  parent?: ContextMenuContextValue
  shouldFilter: boolean
}

const ContextMenuContext = React.createContext<ContextMenuContextValue | null>(
  null
)

function useContextMenuContext() {
  const context = React.useContext(ContextMenuContext)

  if (!context) {
    throw new Error("Context menu parts must be used within ContextMenu")
  }

  return context
}

function getTextContent(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join(" ")
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getTextContent(node.props.children)
  }

  return ""
}

function matchesSearch(
  value: string | undefined,
  children: React.ReactNode,
  query: string
) {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (!normalizedQuery) return true

  return (value ?? getTextContent(children))
    .toLocaleLowerCase()
    .includes(normalizedQuery)
}

function dispatchKeyboardEvent(element: Element, key: string) {
  element.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
    })
  )
}

function isSubmenuTrigger(element: Element) {
  return element.matches('[data-slot="context-menu-subtrigger"]')
}

function isSubmenuOpen(element: Element) {
  return element.hasAttribute("data-popup-open")
}

interface NormalContextMenuRootProps
  extends ContextMenuPrimitive.Root.Props {
  autocomplete?: false
  autocompleteMode?: never
  defaultInputValue?: never
  inputValue?: never
  onInputValueChange?: never
}

interface AutocompleteContextMenuRootProps
  extends ContextMenuPrimitive.Root.Props {
  autocomplete: true
  autocompleteMode?: AutocompleteMode
  defaultInputValue?: string
  inputValue?: string
  onInputValueChange?: (value: string) => void
}

type ContextMenuRootProps =
  | NormalContextMenuRootProps
  | AutocompleteContextMenuRootProps

function ContextMenu({
  autocomplete = false,
  autocompleteMode = "auto",
  inputValue: controlledInputValue,
  onInputValueChange,
  defaultInputValue = "",
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  ...props
}: ContextMenuRootProps) {
  const [uncontrolledInputValue, setUncontrolledInputValue] =
    React.useState(defaultInputValue)
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isInitialRenderRef = React.useRef(true)
  const inputValue = controlledInputValue ?? uncontrolledInputValue
  const open = controlledOpen ?? uncontrolledOpen

  const setInputValue = React.useCallback(
    (value: string) => {
      if (controlledInputValue === undefined) {
        setUncontrolledInputValue(value)
      }
      onInputValueChange?.(value)
    },
    [controlledInputValue, onInputValueChange]
  )

  const handleOpenChange = React.useCallback<
    NonNullable<ContextMenuPrimitive.Root.Props["onOpenChange"]>
  >(
    (nextOpen, eventDetails) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen)
      }

      if (!nextOpen && autocomplete) {
        setInputValue("")
        isInitialRenderRef.current = true
      }

      onOpenChange?.(nextOpen, eventDetails)
    },
    [autocomplete, controlledOpen, onOpenChange, setInputValue]
  )

  const context = React.useMemo<ContextMenuContextValue>(
    () => ({
      autocomplete,
      autocompleteMode,
      inputRef,
      inputValue,
      isInitialRenderRef,
      onInputValueChange: setInputValue,
      shouldFilter: autocomplete && autocompleteMode === "auto",
    }),
    [autocomplete, autocompleteMode, inputValue, setInputValue]
  )

  return (
    <ContextMenuContext.Provider value={context}>
      <ContextMenuPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        loopFocus={false}
        {...props}
      />
    </ContextMenuContext.Provider>
  )
}
interface NormalContextMenuSubProps
  extends ContextMenuPrimitive.SubmenuRoot.Props {
  autocomplete?: false
  autocompleteMode?: never
  defaultInputValue?: never
  inputValue?: never
  onInputValueChange?: never
}

interface AutocompleteContextMenuSubProps
  extends ContextMenuPrimitive.SubmenuRoot.Props {
  autocomplete: true
  autocompleteMode?: AutocompleteMode
  defaultInputValue?: string
  inputValue?: string
  onInputValueChange?: (value: string) => void
}

type ContextMenuSubProps =
  | NormalContextMenuSubProps
  | AutocompleteContextMenuSubProps

function ContextMenuSub({
  autocomplete = false,
  autocompleteMode = "auto",
  inputValue: controlledInputValue,
  onInputValueChange,
  defaultInputValue = "",
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  ...props
}: ContextMenuSubProps) {
  const parent = useContextMenuContext()
  const [uncontrolledInputValue, setUncontrolledInputValue] =
    React.useState(defaultInputValue)
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isInitialRenderRef = React.useRef(true)
  const inputValue = controlledInputValue ?? uncontrolledInputValue
  const open = controlledOpen ?? uncontrolledOpen

  const setInputValue = React.useCallback(
    (value: string) => {
      if (controlledInputValue === undefined) {
        setUncontrolledInputValue(value)
      }
      onInputValueChange?.(value)
    },
    [controlledInputValue, onInputValueChange]
  )

  const handleOpenChange = React.useCallback<
    NonNullable<ContextMenuPrimitive.SubmenuRoot.Props["onOpenChange"]>
  >(
    (nextOpen, eventDetails) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen)
      }

      if (!nextOpen && autocomplete) {
        setInputValue("")
        isInitialRenderRef.current = true
      }

      onOpenChange?.(nextOpen, eventDetails)
    },
    [autocomplete, controlledOpen, onOpenChange, setInputValue]
  )

  const context = React.useMemo<ContextMenuContextValue>(
    () => ({
      autocomplete,
      autocompleteMode,
      inputRef,
      inputValue,
      isInitialRenderRef,
      onInputValueChange: setInputValue,
      parent,
      shouldFilter: autocomplete && autocompleteMode === "auto",
    }),
    [
      autocomplete,
      autocompleteMode,
      inputValue,
      parent,
      setInputValue,
    ]
  )

  return (
    <ContextMenuContext.Provider value={context}>
      <ContextMenuPrimitive.SubmenuRoot
        open={open}
        onOpenChange={handleOpenChange}
        loopFocus={false}
        {...props}
      />
    </ContextMenuContext.Provider>
  )
}
type ContextMenuTriggerProps = ContextMenuPrimitive.Trigger.Props

function ContextMenuTrigger({ className, ...props }: ContextMenuTriggerProps) {
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn(
        "outline-none focus-visible:ring-2 focus-visible:ring-[var(--hui-color-border-focus)] focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}
type ContextMenuCellProps = React.ComponentProps<"div"> & {
  inset?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  variant?: "default" | "destructive"
}

function ContextMenuCell({
  children,
  className,
  inset,
  leadingIcon,
  trailingIcon,
  variant = "default",
  ...props
}: ContextMenuCellProps) {
  return (
    <div
      data-inset={inset || undefined}
      data-variant={variant}
      className={cn(
        "relative flex items-center gap-[var(--hui-space-3)] p-[var(--hui-space-3)] outline-none select-none [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] aria-disabled:pointer-events-none aria-disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:cursor-pointer data-highlighted:rounded-[var(--hui-radius-2)] data-highlighted:bg-[var(--hui-color-background-base-primary-hover)] data-inset:ps-8 data-popup-open:cursor-pointer data-popup-open:rounded-[var(--hui-radius-2)] data-popup-open:bg-[var(--hui-color-background-base-primary-hover)] data-[variant=destructive]:text-[var(--hui-color-foreground-danger-primary)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-[var(--hui-color-foreground-base-secondary)] [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? (
        <span className="ms-auto" aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
    </div>
  )
}

type ContextMenuItemProps = ContextMenuPrimitive.Item.Props & {
  inset?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  value?: string
  variant?: "default" | "destructive"
}

function ContextMenuItem({
  children,
  value,
  leadingIcon,
  trailingIcon,
  inset,
  variant,
  render,
  ...props
}: ContextMenuItemProps) {
  const { autocomplete, inputValue, shouldFilter } = useContextMenuContext()

  if (shouldFilter && !matchesSearch(value, children, inputValue)) {
    return null
  }

  const cell =
    render ?? (
      <ContextMenuCell
        inset={inset}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        variant={variant}
      />
    )

  if (autocomplete) {
    return (
      <AutocompletePrimitive.Item
        data-slot="context-menu-item"
        value={value ?? getTextContent(children)}
        render={<ContextMenuPrimitive.Item render={cell} />}
        {...props}
      >
        {children}
      </AutocompletePrimitive.Item>
    )
  }

  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      render={cell}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Item>
  )
}
type ContextMenuSubTriggerProps =
  ContextMenuPrimitive.SubmenuTrigger.Props & {
    inset?: boolean
    leadingIcon?: React.ReactNode
    trailingIcon?: React.ReactNode
    value?: string
  }

function ContextMenuSubTrigger({
  children,
  value,
  trailingIcon = <ChevronRightIcon />,
  leadingIcon,
  inset,
  ...props
}: ContextMenuSubTriggerProps) {
  const { inputRef, parent } = useContextMenuContext()

  if (
    parent?.shouldFilter &&
    !matchesSearch(value, children, parent.inputValue)
  ) {
    return null
  }

  const cell = (
    <ContextMenuCell
      inset={inset}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
    />
  )

  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-slot="context-menu-subtrigger"
      render={
        parent?.autocomplete ? (
          <AutocompletePrimitive.Item
            value={value ?? getTextContent(children)}
            render={cell}
            onPointerEnter={(event) => {
              if (document.activeElement !== parent.inputRef.current) {
                parent.inputRef.current?.focus()
              }
              props.onPointerEnter?.(event)
            }}
            onKeyDown={(event) => {
              requestAnimationFrame(() => inputRef.current?.focus())
              props.onKeyDown?.(event)
            }}
          />
        ) : (
          cell
        )
      }
      role={parent?.autocomplete ? "option" : "menuitem"}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.SubmenuTrigger>
  )
}
type ContextMenuGroupProps = ContextMenuPrimitive.Group.Props

function ContextMenuGroup({ children, ...props }: ContextMenuGroupProps) {
  const { shouldFilter } = useContextMenuContext()

  if (shouldFilter) return <>{children}</>

  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props}>
      {children}
    </ContextMenuPrimitive.Group>
  )
}
type ContextMenuLabelProps = ContextMenuPrimitive.GroupLabel.Props

function ContextMenuLabel({ className, ...props }: ContextMenuLabelProps) {
  const { shouldFilter } = useContextMenuContext()

  if (shouldFilter) return null

  return (
    <ContextMenuPrimitive.GroupLabel
      data-slot="context-menu-label"
      className={cn(
        "px-[var(--hui-space-3)] py-[var(--hui-space-2)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)]",
        className
      )}
      {...props}
    />
  )
}
type ContextMenuSeparatorProps = ContextMenuPrimitive.Separator.Props

function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuSeparatorProps) {
  const { shouldFilter } = useContextMenuContext()

  if (shouldFilter) return null

  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn(
        "my-[var(--hui-space-2)] h-px bg-[var(--hui-color-border-base-primary)] [margin-inline:calc(var(--hui-space-3)*-1)]",
        className
      )}
      {...props}
    />
  )
}
function ContextMenuEmptyState({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="context-menu-empty-state"
      className={cn(
        "hidden p-[var(--hui-space-3)] text-center text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] only:block",
        className
      )}
      {...props}
    />
  )
}
type ContextMenuContentProps = ContextMenuPrimitive.Popup.Props & {
  align?: ContextMenuPrimitive.Positioner.Props["align"]
  alignOffset?: ContextMenuPrimitive.Positioner.Props["alignOffset"]
  searchLabel?: string
  searchPlaceholder?: string
  sideOffset?: ContextMenuPrimitive.Positioner.Props["sideOffset"]
}

function ContextMenuContent({
  ref,
  className,
  children,
  searchLabel = "Search menu items",
  searchPlaceholder = "Search...",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  onFocus,
  ...props
}: ContextMenuContentProps) {
  const {
    autocomplete,
    inputValue,
    inputRef,
    isInitialRenderRef,
    onInputValueChange,
    parent,
  } = useContextMenuContext()
  const highlightedItem = React.useRef<
    [index: number, reason: "keyboard" | "pointer" | "none"]
  >([-1, "none"])
  const listRef = React.useRef<HTMLDivElement>(null)

  const focusInput = React.useCallback(() => {
    if (document.activeElement !== inputRef.current) {
      inputRef.current?.focus()
    }
  }, [inputRef])

  const highlightFirstItem = React.useCallback(() => {
    if (!isInitialRenderRef.current) return
    isInitialRenderRef.current = false

    const item = listRef.current?.querySelector('[role="option"]')
    item?.dispatchEvent(new PointerEvent("mousemove", { bubbles: true }))
  }, [isInitialRenderRef])

  const openHighlightedSubmenu = React.useCallback(() => {
    if (highlightedItem.current[0] === -1) return

    const items = listRef.current?.querySelectorAll('[role="option"]')
    const item = items?.[highlightedItem.current[0]]

    if (item && isSubmenuTrigger(item)) {
      dispatchKeyboardEvent(item, "ArrowRight")
    }
  }, [])

  const closeHighlightedSubmenu = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (highlightedItem.current[0] === -1) return

      const items = listRef.current?.querySelectorAll('[role="option"]')
      const item = items?.[highlightedItem.current[0]]

      if (!item || !isSubmenuTrigger(item) || !isSubmenuOpen(item)) return

      dispatchKeyboardEvent(item, "Escape")
      event.stopPropagation()
    },
    []
  )

  const closeStaleSubmenu = React.useCallback((index: number) => {
    const items = listRef.current?.querySelectorAll('[role="option"]')
    const item = items?.[index]

    if (!item || !isSubmenuTrigger(item) || !isSubmenuOpen(item)) return

    dispatchKeyboardEvent(item, "Escape")
    item.dispatchEvent(new PointerEvent("pointerout", { bubbles: true }))
  }, [])

  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner
        data-slot="context-menu-positioner"
        className="z-[var(--hui-z-index-portal)]"
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
      >
        <ContextMenuPrimitive.Popup
          ref={ref}
          data-slot="context-menu-content"
          className={cn(
            "box-border max-h-(--available-height) min-w-48 origin-(--transform-origin) overflow-x-hidden overflow-y-auto overscroll-contain rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-soft)] outline-none [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] [transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out)] focus:outline-none focus-visible:outline-none data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out),transform_var(--hui-duration-fast)_var(--hui-ease-out)] motion-safe:data-ending-style:scale-[0.97] motion-safe:data-starting-style:scale-[0.97]",
            className
          )}
          role={autocomplete ? "dialog" : "menu"}
          onFocus={
            autocomplete || parent?.autocomplete
              ? (event) => {
                  focusInput()
                  event.stopPropagation()
                  highlightFirstItem()
                  onFocus?.(event)
                }
              : onFocus
          }
          {...props}
        >
          {autocomplete ? (
            <AutocompletePrimitive.Root
              inline
              open
              value={inputValue}
              onValueChange={(value) => onInputValueChange(value)}
              autoHighlight={Boolean(inputValue)}
              mode="none"
              loopFocus={false}
              onItemHighlighted={(_, eventDetails) => {
                if (
                  highlightedItem.current[1] === "pointer" &&
                  eventDetails.reason === "keyboard"
                ) {
                  closeStaleSubmenu(highlightedItem.current[0])
                }

                highlightedItem.current = [
                  eventDetails.index,
                  eventDetails.reason,
                ]
              }}
            >
              <AutocompletePrimitive.Input
                ref={inputRef}
                data-slot="context-menu-search-input"
                aria-label={searchLabel}
                placeholder={searchPlaceholder}
                className="mb-[var(--hui-space-2)] h-8 w-full rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] shadow-none outline-none placeholder:text-[var(--hui-color-foreground-base-secondary)] focus-visible:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:ring-0 focus-visible:outline-none forced-colors:focus-visible:outline forced-colors:focus-visible:outline-1 forced-colors:focus-visible:outline-offset-[-2px]"
                onPointerEnter={focusInput}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") return
                  if (event.key === "Escape") {
                    closeHighlightedSubmenu(event)
                    return
                  }
                  if (event.key === "ArrowRight" || event.key === "Enter") {
                    openHighlightedSubmenu()
                  }
                  event.stopPropagation()
                }}
                tabIndex={-1}
              />
              <AutocompletePrimitive.List
                ref={listRef}
                data-slot="context-menu-search-list"
              >
                {children}
              </AutocompletePrimitive.List>
            </AutocompletePrimitive.Root>
          ) : (
            children
          )}
        </ContextMenuPrimitive.Popup>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  )
}
function ContextMenuSubContent(props: ContextMenuContentProps) {
  return <ContextMenuContent sideOffset={2} alignOffset={-4} {...props} />
}

export {
  ContextMenu,
  ContextMenuContent,
  ContextMenuEmptyState,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
}

export type {
  AutocompleteContextMenuRootProps,
  AutocompleteContextMenuSubProps,
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuItemProps,
  ContextMenuLabelProps,
  ContextMenuRootProps,
  ContextMenuSeparatorProps,
  ContextMenuSubProps,
  ContextMenuSubTriggerProps,
  ContextMenuTriggerProps,
  NormalContextMenuRootProps,
  NormalContextMenuSubProps,
}
