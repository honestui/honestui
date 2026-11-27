"use client"

import * as React from "react"
import {
  ChartLine as ChartLineIcon,
  FileText as FileTextIcon,
  Mail as MailIcon,
  Search as SearchIcon,
} from "honestui/icons"

import { PromptSuggestions, type PromptSuggestion } from "@/registry/honest-ai/ai/prompt-suggestions"

// Sample prompt starters.
const sampleSuggestions: PromptSuggestion[] = [
  { id: "late", label: "Find late invoices", prompt: "Which invoices are more than 30 days late?", icon: <SearchIcon /> },
  { id: "trend", label: "Chart this month's revenue", icon: <ChartLineIcon /> },
  { id: "summary", label: "Summarize the Q3 report", icon: <FileTextIcon /> },
  { id: "email", label: "Draft a payment reminder", icon: <MailIcon /> },
]

/** Nothing is sent here. It shows the prompt your `onSelect` receives. */
export default function PromptSuggestionsDemo() {
  const [chosen, setChosen] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-5)]">
      <PromptSuggestions suggestions={sampleSuggestions} onSelect={(suggestion) => setChosen(suggestion.prompt)} />
      <p
        aria-live="polite"
        className="m-0 min-h-5 px-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
      >
        {chosen && <>Sent: {chosen}</>}
      </p>
    </div>
  )
}
