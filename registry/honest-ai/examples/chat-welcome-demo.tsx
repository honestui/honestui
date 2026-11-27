"use client"

import * as React from "react"
import {
  ChartLine as ChartLineIcon,
  Mail as MailIcon,
  Search as SearchIcon,
  Sparkles as SparklesIcon,
} from "honestui/icons"

import { ChatWelcome } from "@/registry/honest-ai/ai/chat-welcome"
import type { PromptSuggestion } from "@/registry/honest-ai/ai/prompt-suggestions"
import { PromptBar } from "@/registry/honest-ai/ai/prompt-bar"

// Sample prompt starters.
const sampleSuggestions: PromptSuggestion[] = [
  { id: "late", label: "Find late invoices", icon: <SearchIcon /> },
  { id: "trend", label: "Chart this month's revenue", icon: <ChartLineIcon /> },
  { id: "email", label: "Draft a payment reminder", icon: <MailIcon /> },
]

/** A full-page start: greeting, composer, and starters. Nothing is sent here. */
export default function ChatWelcomeDemo() {
  const [value, setValue] = React.useState("")

  return (
    <div className="w-full max-w-xl min-w-0 py-[var(--hui-space-6)]">
      <ChatWelcome
        icon={<SparklesIcon />}
        title="What should we look into?"
        description="Ask about invoices, payouts, or a failed export. Answers cite the records they come from."
        composer={
          <PromptBar
            value={value}
            onValueChange={setValue}
            placeholder="Ask about the billing export…"
            onSubmit={() => setValue("")}
          />
        }
        suggestions={sampleSuggestions}
        onSelectSuggestion={(suggestion) => setValue(suggestion.prompt)}
      />
    </div>
  )
}
