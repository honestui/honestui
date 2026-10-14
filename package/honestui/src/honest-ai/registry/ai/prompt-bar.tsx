"use client"

import * as React from "react"
import {
  ArrowUp as ArrowUpIcon,
  ChevronDown as ChevronDownIcon,
  File as FileIcon,
  Paperclip as PaperclipIcon,
  Square as SquareIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "../../components/ui/menu.js"

export type PromptBarItem = {
  id: string
  /** The text inserted after the trigger character, and matched against what is typed. */
  label: string
  description?: string
  icon?: React.ReactNode
}

export type PromptBarModel = {
  id: string
  label: string
  description?: string
  /** Shown before the label, such as the logo of the model's maker. Decorative: the label names the model. */
  icon?: React.ReactNode
}

export type PromptBarSubmission = {
  /** The prompt, trimmed. */
  text: string
  attachments: File[]
  /** The selected model's `id`, when `models` is passed. */
  model: string | undefined
}

export type PromptBarLabels = {
  prompt: string
  send: string
  stop: string
  attach: string
  attachments: string
  removeAttachment: (name: string) => string
  model: string
  mentions: string
  commands: string
  noMatches: (query: string) => string
  suggestionCount: (count: number) => string
}

export const defaultPromptBarLabels: PromptBarLabels = {
  prompt: "Prompt",
  send: "Send",
  stop: "Stop",
  attach: "Attach files",
  attachments: "Attachments",
  removeAttachment: (name) => `Remove ${name}`,
  model: "Model",
  mentions: "Sources",
  commands: "Commands",
  noMatches: (query) => `No matches for “${query}”.`,
  suggestionCount: (count) => (count === 1 ? "1 suggestion" : `${count} suggestions`),
}

const MAX_INPUT_HEIGHT = 160

const bodyText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

type Suggestion = {
  kind: "mention" | "command"
  /** Where the trigger character sits in the text. */
  start: number
  query: string
}

/** Finds an `@word` or `/word` that ends at the caret and starts a word. */
function findSuggestion(text: string, caret: number): Suggestion | null {
  const match = /(^|\s)([@/])([\w-]*)$/.exec(text.slice(0, caret))
  if (!match) return null

  return {
    kind: match[2] === "@" ? "mention" : "command",
    start: match.index + match[1].length,
    query: match[3].toLowerCase(),
  }
}

function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange: ((value: T) => void) | undefined
) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = controlled !== undefined ? controlled : uncontrolled
  const setValue = (next: T) => {
    if (controlled === undefined) setUncontrolled(next)
    onChange?.(next)
  }

  return [value, setValue] as const
}

export type PromptBarProps = Omit<
  React.ComponentProps<"form">,
  "children" | "onSubmit" | "defaultValue"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Receives the prompt when the person sends it. The bar then clears. */
  onSubmit: (submission: PromptBarSubmission) => void
  placeholder?: string
  /** Blocks typing and sending, for example while a reply is streaming. */
  disabled?: boolean
  /** Pass it only while a reply is in progress. Stop then takes the place of Send. */
  onStop?: () => void
  /** Offered after the person types `@`. */
  mentions?: PromptBarItem[]
  /** Offered after the person types `/`. */
  commands?: PromptBarItem[]
  /** Called when a suggestion is inserted, so you can track what the text refers to. */
  onItemSelect?: (item: PromptBarItem, kind: "mention" | "command") => void
  /** Passing models adds the model menu. */
  models?: PromptBarModel[]
  model?: string
  defaultModel?: string
  onModelChange?: (model: string) => void
  /** Adds the attach button and the list of chosen files. */
  allowAttachments?: boolean
  attachments?: File[]
  onAttachmentsChange?: (attachments: File[]) => void
  /** Passed to the file input, such as "image/*,.pdf". */
  accept?: string
  /** Extra controls placed before Send, such as a dictation button you wire up. */
  actions?: React.ReactNode
  labels?: Partial<PromptBarLabels>
}

/**
 * A prompt field with optional `@` and `/` suggestions, attachments, a model
 * menu, and a Stop button. It collects the prompt and hands it to `onSubmit`;
 * the request, the reply, and cancelling it are your application's.
 */
function PromptBar({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  placeholder,
  disabled = false,
  onStop,
  mentions,
  commands,
  onItemSelect,
  models,
  model: modelProp,
  defaultModel,
  onModelChange,
  allowAttachments = false,
  attachments: attachmentsProp,
  onAttachmentsChange,
  accept,
  actions,
  labels: labelsProp,
  className,
  ...props
}: PromptBarProps) {
  const labels = React.useMemo(
    () => ({ ...defaultPromptBarLabels, ...labelsProp }),
    [labelsProp]
  )
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange)
  const [model, setModel] = useControllableState(
    modelProp,
    defaultModel ?? models?.[0]?.id ?? "",
    onModelChange
  )
  const [attachments, setAttachments] = useControllableState<File[]>(
    attachmentsProp,
    [],
    onAttachmentsChange
  )

  const [caret, setCaret] = React.useState(value.length)
  const [activeIndex, setActiveIndex] = React.useState(0)
  // Escape closes the suggestions until the text changes again.
  const [dismissedAt, setDismissedAt] = React.useState<string | null>(null)

  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const sendButtonRef = React.useRef<HTMLButtonElement>(null)
  const shouldRefocusInput = React.useRef(false)
  const pendingCaret = React.useRef<number | null>(null)
  const listId = React.useId()

  const hasSuggestions = Boolean(mentions?.length || commands?.length)
  const suggestion = dismissedAt === value ? null : findSuggestion(value, caret)
  const source = suggestion?.kind === "mention" ? mentions : commands
  const matches = React.useMemo(() => {
    if (!suggestion || !source?.length) return []
    return source.filter((item) => {
      const label = item.label.toLowerCase()
      return suggestion.kind === "mention"
        ? label.includes(suggestion.query)
        : label.startsWith(suggestion.query)
    })
  }, [suggestion, source])
  const isMenuOpen = Boolean(suggestion && source?.length)
  const activeItem = matches[Math.min(activeIndex, matches.length - 1)]

  React.useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return

    // Grow with the text up to a limit, then scroll.
    input.style.height = "0px"
    input.style.height = `${Math.min(input.scrollHeight, MAX_INPUT_HEIGHT)}px`
    input.style.overflowY = input.scrollHeight > MAX_INPUT_HEIGHT ? "auto" : "hidden"

    if (pendingCaret.current !== null) {
      input.setSelectionRange(pendingCaret.current, pendingCaret.current)
      pendingCaret.current = null
    }
  }, [value])

  const changeValue = (next: string, nextCaret: number) => {
    setValue(next)
    setCaret(nextCaret)
    setActiveIndex(0)
    setDismissedAt(null)
  }

  const insertItem = (item: PromptBarItem) => {
    if (!suggestion) return

    const trigger = suggestion.kind === "mention" ? "@" : "/"
    const inserted = `${trigger}${item.label} `
    const nextCaret = suggestion.start + inserted.length
    pendingCaret.current = nextCaret
    changeValue(value.slice(0, suggestion.start) + inserted + value.slice(caret), nextCaret)
    onItemSelect?.(item, suggestion.kind)
    inputRef.current?.focus()
  }

  const text = value.trim()
  const isStoppable = onStop !== undefined
  const canSend = !disabled && !isStoppable && (text !== "" || attachments.length > 0)

  // Stop becomes Send again, often a disabled one. Hand focus to the field once
  // it can take it, unless the person has already moved somewhere else.
  React.useEffect(() => {
    if (!shouldRefocusInput.current || isStoppable || disabled) return
    shouldRefocusInput.current = false
    if (document.activeElement === sendButtonRef.current) inputRef.current?.focus()
  }, [isStoppable, disabled])

  const send = () => {
    if (!canSend) return
    onSubmit({ text, attachments, model: models?.length ? model : undefined })
    changeValue("", 0)
    setAttachments([])
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter confirms an in-progress IME composition; it must not send or pick.
    if (event.nativeEvent.isComposing) return

    if (isMenuOpen) {
      if (event.key === "Escape") {
        event.preventDefault()
        setDismissedAt(value)
        return
      }
      if (matches.length > 0) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault()
          const step = event.key === "ArrowDown" ? 1 : matches.length - 1
          setActiveIndex((current) => (Math.min(current, matches.length - 1) + step) % matches.length)
          return
        }
        if ((event.key === "Enter" && !event.shiftKey) || event.key === "Tab") {
          event.preventDefault()
          if (activeItem) insertItem(activeItem)
          return
        }
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  const optionId = (item: PromptBarItem) => `${listId}-${item.id}`
  const selectedModel = models?.find((item) => item.id === model)

  return (
    <form
      data-slot="prompt-bar"
      data-disabled={disabled ? "" : undefined}
      className={cn("relative w-full min-w-0", className)}
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
      {...props}
    >
      {isMenuOpen && (
        <div
          data-slot="prompt-bar-suggestions"
          className={cn(
            "absolute inset-x-0 bottom-full z-10 mb-[var(--hui-space-3)] max-h-64 overflow-y-auto rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-lifted)]",
            smallText
          )}
        >
          {matches.length > 0 ? (
            <div
              id={listId}
              role="listbox"
              aria-label={suggestion?.kind === "mention" ? labels.mentions : labels.commands}
            >
              {matches.map((item) => {
                const isActive = item === activeItem
                return (
                  <div
                    key={item.id}
                    id={optionId(item)}
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive ? "" : undefined}
                    // Keep focus in the field, so typing continues after a pick.
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseMove={() => setActiveIndex(matches.indexOf(item))}
                    onClick={() => insertItem(item)}
                    className="flex min-w-0 cursor-pointer items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-3)] py-[var(--hui-space-3)] data-active:bg-[var(--hui-color-background-base-primary-hover)]"
                  >
                    {item.icon && (
                      <span
                        aria-hidden="true"
                        className="flex size-4 shrink-0 items-center justify-center text-[var(--hui-color-foreground-base-secondary)] [&_svg]:size-4"
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="shrink-0 [font-weight:var(--hui-font-weight-medium)]">
                      {suggestion?.kind === "command" ? `/${item.label}` : item.label}
                    </span>
                    {item.description && (
                      <span className="min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)]">
                        {item.description}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="m-0 px-[var(--hui-space-3)] py-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]">
              {labels.noMatches(suggestion?.query ?? "")}
            </p>
          )}
        </div>
      )}

      {hasSuggestions && (
        <span role="status" className="sr-only">
          {isMenuOpen
            ? matches.length > 0
              ? labels.suggestionCount(matches.length)
              : labels.noMatches(suggestion?.query ?? "")
            : ""}
        </span>
      )}

      <div
        data-slot="prompt-bar-field"
        className="flex flex-col gap-[var(--hui-space-2)] rounded-[var(--hui-radius-5)] border-[0.5px] border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-3)] shadow-[var(--hui-shadow-soft)] motion-safe:[transition:var(--hui-transition-interactive)] focus-within:border-[var(--hui-color-border-accent-emphasis)] in-data-disabled:opacity-60"
      >
        {attachments.length > 0 && (
          <ul
            role="list"
            aria-label={labels.attachments}
            data-slot="prompt-bar-attachments"
            className="m-0 flex list-none flex-wrap gap-[var(--hui-space-2)] p-0"
          >
            {attachments.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                className={cn(
                  "flex min-w-0 max-w-full items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] py-[var(--hui-space-1)] ps-[var(--hui-space-3)] pe-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)]",
                  smallText
                )}
              >
                <FileIcon aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="min-w-0 truncate">{file.name}</span>
                <Button
                  variant="link"
                  size="icon-sm"
                  disabled={disabled}
                  aria-label={labels.removeAttachment(file.name)}
                  onClick={() => {
                    setAttachments(attachments.filter((_, position) => position !== index))
                    inputRef.current?.focus()
                  }}
                >
                  <CloseIcon aria-hidden="true" className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <textarea
          ref={inputRef}
          rows={1}
          data-slot="prompt-bar-input"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={labels.prompt}
          // A textarea cannot take the combobox role, so it stays a text box that
          // points at the list and its active option.
          {...(hasSuggestions && {
            "aria-autocomplete": "list" as const,
            "aria-haspopup": "listbox" as const,
            "aria-controls": isMenuOpen && matches.length > 0 ? listId : undefined,
            "aria-activedescendant": isMenuOpen && activeItem ? optionId(activeItem) : undefined,
          })}
          onChange={(event) => changeValue(event.target.value, event.target.selectionStart)}
          onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={handleKeyDown}
          className={cn(
            "m-0 block w-full min-w-0 resize-none border-0 bg-transparent px-[var(--hui-space-2)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] outline-none [overflow-wrap:anywhere] placeholder:text-[var(--hui-color-foreground-base-tertiary)] disabled:cursor-not-allowed",
            bodyText
          )}
        />

        <div
          data-slot="prompt-bar-controls"
          className="flex min-w-0 flex-wrap items-center gap-[var(--hui-space-2)]"
        >
          {allowAttachments && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                accept={accept}
                tabIndex={-1}
                onChange={(event) => {
                  const added = Array.from(event.target.files ?? [])
                  if (added.length > 0) setAttachments([...attachments, ...added])
                  // Clear the input so choosing the same file again still fires a change.
                  event.target.value = ""
                  inputRef.current?.focus()
                }}
              />
              <Button
                variant="link"
                size="icon"
                disabled={disabled}
                aria-label={labels.attach}
                onClick={() => fileInputRef.current?.click()}
              >
                <PaperclipIcon aria-hidden="true" />
              </Button>
            </>
          )}

          {models && models.length > 0 && (
            <Menu>
              <MenuTrigger
                disabled={disabled}
                render={
                  <Button variant="link" size="sm" className="max-w-full min-w-0" />
                }
              >
                <span className="sr-only">{labels.model}: </span>
                {selectedModel?.icon}
                <span className="min-w-0 truncate">{selectedModel?.label ?? labels.model}</span>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="size-3 text-[var(--hui-color-foreground-base-tertiary)]"
                />
              </MenuTrigger>
              <MenuPopup align="start" className="min-w-48">
                <MenuRadioGroup value={model} onValueChange={(next) => setModel(String(next))}>
                  {models.map((item) => (
                    <MenuRadioItem key={item.id} value={item.id}>
                      <span className="flex min-w-0 items-center justify-between gap-[var(--hui-space-4)]">
                        <span className="flex min-w-0 items-center gap-[var(--hui-space-2)]">
                          {item.icon}
                          <span className="min-w-0 truncate">{item.label}</span>
                        </span>
                        {item.description && (
                          <span className="shrink-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)]">
                            {item.description}
                          </span>
                        )}
                      </span>
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuPopup>
            </Menu>
          )}

          <div
            data-slot="prompt-bar-actions"
            className="ms-auto flex shrink-0 items-center gap-[var(--hui-space-2)]"
          >
            {actions}
            {/* One button for both, so focus stays put when a reply starts. */}
            <Button
              ref={sendButtonRef}
              type={isStoppable ? "button" : "submit"}
              size="icon"
              disabled={!isStoppable && !canSend}
              aria-label={isStoppable ? labels.stop : labels.send}
              onClick={
                onStop &&
                ((event) => {
                  // The button may be a submit button again by the time the click
                  // finishes. Without this, stopping would also send the draft.
                  event.preventDefault()
                  shouldRefocusInput.current = true
                  onStop()
                })
              }
            >
              {isStoppable ? (
                <SquareIcon aria-hidden="true" fill="currentColor" className="size-3" />
              ) : (
                <ArrowUpIcon aria-hidden="true" strokeWidth={2} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

export { PromptBar }
