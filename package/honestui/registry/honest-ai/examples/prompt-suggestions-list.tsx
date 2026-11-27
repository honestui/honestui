"use client"

import { PromptSuggestions, type PromptSuggestion } from "@/registry/honest-ai/ai/prompt-suggestions"

const sampleSuggestions: PromptSuggestion[] = [
  { id: "a", label: "Walk me through setting up SSO" },
  { id: "b", label: "Explain how usage is billed" },
  { id: "c", label: "Help me invite my team" },
]

/** Full-width rows, for longer prompts. */
export default function PromptSuggestionsList() {
  return (
    <div className="w-full max-w-md min-w-0">
      <PromptSuggestions layout="list" suggestions={sampleSuggestions} onSelect={() => {}} />
    </div>
  )
}
