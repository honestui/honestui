"use client"

import * as React from "react"

import { SearchList } from "@/registry/honest-ai/ai/search-list"

export default function SearchListThreadsExample() {
  const [opened, setOpened] = React.useState("")

  return (
    <div className="flex w-full max-w-[32rem] min-w-0 flex-col gap-[var(--hui-space-4)]">
      <SearchList
        label="Search recent threads"
        placeholder="Search recent threads…"
        emptyMessage="No threads match. Clear the search to see them all."
        items={[
          // Every row is a thread, so a shared icon would add nothing; the
          // last-active day tells them apart.
          { id: "t1", label: "Billing export rounding", description: "Today" },
          { id: "t2", label: "Staging migration plan", description: "Yesterday" },
          { id: "t3", label: "Focus ring contrast", description: "Mar 4" },
        ]}
        onSelect={(item) => setOpened(item.label)}
      />
      <p
        role="status"
        className="m-0 min-h-[18px] px-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-tertiary)] [font-size:var(--hui-font-size-small)]"
      >
        {opened ? `Opened “${opened}”` : ""}
      </p>
    </div>
  )
}
