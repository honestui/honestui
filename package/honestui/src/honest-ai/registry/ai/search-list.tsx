"use client"

import * as React from "react"
import { Search as SearchIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"
import {
  Command,
  CommandContent,
  CommandEmpty,
  CommandInput,
  CommandItem,
} from "../../components/ui/command.js"

export type SearchListItem = {
  id: string
  /** Shown in the list and matched against what is typed. */
  label: string
  description?: string
  icon?: React.ReactNode
}

export type SearchListProps = {
  items: SearchListItem[]
  onSelect: (item: SearchListItem) => void
  /** Names the search field for screen readers. */
  label: string
  placeholder?: string
  /** Shown when nothing matches. */
  emptyMessage?: string
  className?: string
}

/**
 * A search field over a short list, such as saved prompts or recent threads.
 * It is the Honest UI Command, arranged for one flat list.
 */
function SearchList({
  items,
  onSelect,
  label,
  placeholder,
  emptyMessage = "No results. Try a different search.",
  className,
}: SearchListProps) {
  return (
    <div
      data-slot="search-list"
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-soft)]",
        className
      )}
    >
      <Command>
        <CommandInput
          aria-label={label}
          // The list is always shown, and a combobox must say whether its list is open.
          aria-expanded
          placeholder={placeholder}
          leadingIcon={<SearchIcon />}
        />
        <CommandContent>
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          {items.map((item) => (
            <CommandItem
              key={item.id}
              value={item.label}
              leadingIcon={item.icon}
              onClick={() => onSelect(item)}
            >
              <span className="flex min-w-0 flex-1 items-baseline justify-between gap-[var(--hui-space-4)]">
                <span className="min-w-0 truncate">{item.label}</span>
                {item.description && (
                  <span className="shrink-0 text-[var(--hui-color-foreground-base-secondary)]">
                    {item.description}
                  </span>
                )}
              </span>
            </CommandItem>
          ))}
        </CommandContent>
      </Command>
    </div>
  )
}

export { SearchList }
