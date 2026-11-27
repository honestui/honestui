"use client"

import { PromptSuggestions, type PromptSuggestion } from "@/registry/honest-ai/ai/prompt-suggestions"

const sampleSuggestions: PromptSuggestion[] = [
  { id: "a", label: "Why did the nightly export fail?" },
  { id: "b", label: "Compare last two deploys" },
  { id: "c", label: "List open incidents" },
  { id: "d", label: "Who owns the billing service?" },
  { id: "e", label: "Show slowest endpoints" },
]

/** One line that scrolls sideways, for a narrow composer. */
export default function PromptSuggestionsScroll() {
  return (
    <div className="w-full max-w-sm min-w-0">
      <PromptSuggestions layout="scroll" suggestions={sampleSuggestions} onSelect={() => {}} />
    </div>
  )
}
