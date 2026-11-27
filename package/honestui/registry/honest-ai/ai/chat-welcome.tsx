"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  PromptSuggestions,
  type PromptSuggestion,
  type PromptSuggestionsProps,
} from "@/registry/honest-ai/ai/prompt-suggestions"

export type ChatWelcomeLabels = {
  /** Names the suggestions for screen readers. */
  suggestions: string
}

export const defaultChatWelcomeLabels: ChatWelcomeLabels = {
  suggestions: "Suggested prompts",
}

export type ChatWelcomeProps = Omit<React.ComponentProps<"section">, "title" | "children"> & {
  /** The greeting, such as "Good morning, Ana". */
  title: React.ReactNode
  /** One or two lines on what the assistant can help with. */
  description?: React.ReactNode
  /** A mark above the title: your assistant's icon or avatar. Decorative. */
  icon?: React.ReactNode
  /** Prompt starters. Leave it out to show none. */
  suggestions?: PromptSuggestion[]
  onSelectSuggestion?: PromptSuggestionsProps["onSelect"]
  /** How the suggestions are laid out. */
  suggestionsLayout?: PromptSuggestionsProps["layout"]
  /** A composer under the greeting, such as a Prompt Bar, for a full-page start. */
  composer?: React.ReactNode
  /** "center" for a new chat page, "start" for a narrow panel. */
  align?: "center" | "start"
  /** Turns the suggestions off, such as while the first reply is starting. */
  disabled?: boolean
  labels?: Partial<ChatWelcomeLabels>
}

/**
 * What a new conversation opens on: a greeting, what the assistant can do,
 * and a few prompts to start from. Drop it into ChatThread's `emptyMessage`,
 * or give it a composer for a full-page start.
 */
function ChatWelcome({
  title,
  description,
  icon,
  suggestions,
  onSelectSuggestion,
  suggestionsLayout = "wrap",
  composer,
  align = "center",
  disabled,
  labels: labelsProp,
  className,
  ...props
}: ChatWelcomeProps) {
  const labels = { ...defaultChatWelcomeLabels, ...labelsProp }
  const titleId = React.useId()
  const isCenter = align === "center"
  const hasSuggestions = Boolean(suggestions?.length && onSelectSuggestion)

  return (
    <section
      aria-labelledby={titleId}
      data-slot="chat-welcome"
      data-align={align}
      className={cn(
        "flex w-full min-w-0 flex-col gap-[var(--hui-space-7)] text-[var(--hui-color-foreground-base-primary)]",
        isCenter ? "items-center text-center" : "items-start text-left",
        className
      )}
      {...props}
    >
      <div className={cn("flex min-w-0 flex-col gap-[var(--hui-space-3)]", isCenter && "items-center")}>
        {icon && (
          <span
            aria-hidden="true"
            data-slot="chat-welcome-icon"
            className="mb-[var(--hui-space-3)] flex size-10 shrink-0 items-center justify-center rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-secondary)] shadow-[var(--hui-shadow-soft)] [&_svg]:size-5"
          >
            {icon}
          </span>
        )}
        <h2
          id={titleId}
          className="m-0 text-balance [font-size:var(--hui-font-size-t1)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-t1)] [line-height:var(--hui-line-height-t1)]"
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "m-0 max-w-[44ch] text-pretty text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]",
              isCenter && "mx-auto"
            )}
          >
            {description}
          </p>
        )}
      </div>

      {composer && (
        <div data-slot="chat-welcome-composer" className="w-full min-w-0 text-left">
          {composer}
        </div>
      )}

      {hasSuggestions && (
        <PromptSuggestions
          suggestions={suggestions!}
          onSelect={onSelectSuggestion!}
          layout={suggestionsLayout}
          disabled={disabled}
          labels={{ group: labels.suggestions }}
          className={cn(
            suggestionsLayout === "list" ? "w-full text-left" : "max-w-full",
            isCenter && suggestionsLayout === "wrap" && "justify-center"
          )}
        />
      )}
    </section>
  )
}

export { ChatWelcome }
