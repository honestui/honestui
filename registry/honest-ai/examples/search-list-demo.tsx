"use client"

import * as React from "react"

import { SearchList, type SearchListItem } from "@/registry/honest-ai/ai/search-list"

// Sample saved prompts. A description is shown only where it tells one row
// from the others, here the prompts shared with a team.
const samplePrompts: SearchListItem[] = [
  { id: "summarize", label: "Summarize this thread" },
  { id: "review", label: "Review the last change", description: "Shared" },
  { id: "plan", label: "Plan before editing" },
  { id: "tests", label: "Write tests for this file", description: "Shared" },
  { id: "explain", label: "Explain this error" },
]

export default function SearchListDemo() {
  const [selected, setSelected] = React.useState<SearchListItem | null>(null)

  return (
    <div className="flex w-full max-w-[32rem] min-w-0 flex-col gap-[var(--hui-space-4)]">
      <SearchList
        label="Search saved prompts"
        placeholder="Search saved prompts…"
        items={samplePrompts}
        onSelect={setSelected}
      />
      <p
        role="status"
        className="m-0 min-h-[18px] px-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-tertiary)] [font-size:var(--hui-font-size-small)]"
      >
        {selected ? `onSelect received “${selected.label}”` : "Nothing selected yet."}
      </p>
    </div>
  )
}
