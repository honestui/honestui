"use client"

import * as React from "react"

import { cn } from "../../lib/utils.js"

export type PromptSuggestion = {
  id: string
  /** The words on the chip. */
  label: string
  /** The prompt to send, when it is longer than the label. Defaults to the label. */
  prompt?: string
  /** A small decorative icon before the label. */
  icon?: React.ReactNode
}

export type PromptSuggestionsLabels = {
  /** Names the group for screen readers. */
  group: string
}

export const defaultPromptSuggestionsLabels: PromptSuggestionsLabels = {
  group: "Suggested prompts",
}

export type PromptSuggestionsProps = Omit<React.ComponentProps<"ul">, "children" | "onSelect"> & {
  suggestions: PromptSuggestion[]
  /** Called with the chosen suggestion. Its `prompt` falls back to its `label`. */
  onSelect: (suggestion: PromptSuggestion & { prompt: string }) => void
  /**
   * "wrap" lets the chips flow onto more lines. "scroll" keeps them on one
   * line that scrolls sideways. "list" stacks them as full-width rows.
   */
  layout?: "wrap" | "scroll" | "list"
  /** Turns every chip off, such as while a reply is streaming. */
  disabled?: boolean
  labels?: Partial<PromptSuggestionsLabels>
}

const regularText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

/**
 * Prompt starters a person can send with one click. It renders the
 * suggestions you pass; Arrow keys move between them once one has focus.
 */
function PromptSuggestions({
  suggestions,
  onSelect,
  layout = "wrap",
  disabled = false,
  labels: labelsProp,
  className,
  onKeyDown,
  ...props
}: PromptSuggestionsProps) {
  const labels = { ...defaultPromptSuggestionsLabels, ...labelsProp }
  const isList = layout === "list"

  // One stop in the Tab order; the arrow keys move along the row.
  const [activeIndex, setActiveIndex] = React.useState(0)
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const tabIndexFor = Math.min(activeIndex, Math.max(suggestions.length - 1, 0))

  function moveFocus(next: number) {
    const count = suggestions.length
    if (count === 0) return
    const index = (next + count) % count
    setActiveIndex(index)
    const button = buttonRefs.current[index]
    button?.focus()
    button?.scrollIntoView?.({ block: "nearest", inline: "nearest" })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const forward = isList ? "ArrowDown" : "ArrowRight"
    const backward = isList ? "ArrowUp" : "ArrowLeft"
    const keys: Record<string, () => void> = {
      [forward]: () => moveFocus(tabIndexFor + 1),
      [backward]: () => moveFocus(tabIndexFor - 1),
      Home: () => moveFocus(0),
      End: () => moveFocus(suggestions.length - 1),
    }
    const action = keys[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }

  if (suggestions.length === 0) return null

  return (
    <ul
      role="list"
      aria-label={labels.group}
      data-slot="prompt-suggestions"
      data-layout={layout}
      onKeyDown={handleKeyDown}
      className={cn(
        "m-0 flex min-w-0 list-none p-0",
        layout === "wrap" && "flex-wrap gap-[var(--hui-space-3)]",
        // Room for the focus ring and the shadow inside the scroller.
        layout === "scroll" &&
          "-m-[var(--hui-space-2)] gap-[var(--hui-space-3)] overflow-x-auto p-[var(--hui-space-2)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        isList &&
          "flex-col overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion.id}
          className={cn(
            "min-w-0",
            layout === "scroll" && "shrink-0",
            isList && "border-b-[0.5px] border-[var(--hui-color-border-base-primary)] last:border-b-0"
          )}
        >
          <button
            ref={(node) => {
              buttonRefs.current[index] = node
            }}
            type="button"
            data-slot="prompt-suggestion"
            disabled={disabled}
            tabIndex={index === tabIndexFor ? 0 : -1}
            onFocus={() => setActiveIndex(index)}
            onClick={() => onSelect({ ...suggestion, prompt: suggestion.prompt ?? suggestion.label })}
            className={cn(
              "group/suggestion flex min-w-0 cursor-pointer items-center gap-[var(--hui-space-3)] text-left text-[var(--hui-color-foreground-base-primary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] focus-visible:[outline:var(--hui-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
              regularText,
              isList
                ? "min-h-11 w-full rounded-none border-0 bg-transparent px-[var(--hui-space-5)] py-[var(--hui-space-3)] not-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]"
                : "min-h-9 max-w-full rounded-[var(--hui-radius-5)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-2)] shadow-[var(--hui-shadow-feather)] not-disabled:hover:border-[var(--hui-color-border-base-secondary)] not-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)]",
              suggestion.icon && !isList && "ps-[var(--hui-space-4)]"
            )}
          >
            {suggestion.icon && (
              <span
                aria-hidden="true"
                className="flex shrink-0 text-[var(--hui-color-foreground-base-tertiary)] group-hover/suggestion:text-[var(--hui-color-foreground-base-secondary)] [&_svg]:size-4"
              >
                {suggestion.icon}
              </span>
            )}
            <span className={cn("min-w-0", layout === "scroll" ? "whitespace-nowrap" : "break-words")}>
              {suggestion.label}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export { PromptSuggestions }
