"use client"

import * as React from "react"

import { MemoryViewer, type MemoryItem } from "@/registry/honest-ai/ai/memory-viewer"

// Fixed dates relative to a fixed "now", so the example reads the same every day.
const now = new Date("2026-11-26T15:00:00Z")
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000)

const sampleMemories: MemoryItem[] = [
  {
    id: "m1",
    kind: "profile",
    content: "Leads the finance operations team at a 40-person design studio.",
    source: { label: "Onboarding chat" },
    createdAt: daysAgo(64),
    lastUsedAt: daysAgo(1),
    pinned: true,
  },
  {
    id: "m2",
    kind: "profile",
    content: "Works from Lisbon, usually between 9:00 and 17:30.",
    source: { label: "Scheduling the quarterly review" },
    createdAt: daysAgo(40),
    lastUsedAt: daysAgo(6),
  },
  {
    id: "m3",
    kind: "preference",
    content: "Wants totals in euros, with VAT shown separately.",
    source: { label: "March invoice summary" },
    createdAt: daysAgo(31),
    lastUsedAt: daysAgo(2),
  },
  {
    id: "m4",
    kind: "preference",
    content: "Prefers short answers with a table over long paragraphs.",
    source: { label: "Budget variance questions" },
    createdAt: daysAgo(22),
    lastUsedAt: daysAgo(0.2),
  },
  {
    id: "m5",
    kind: "fact",
    content: "The studio closes its books on the 5th working day of each month.",
    source: { label: "Month-end checklist" },
    createdAt: daysAgo(18),
    lastUsedAt: daysAgo(9),
    confidence: 0.92,
  },
  {
    id: "m6",
    kind: "fact",
    content: "Their accountant might be switching firms in January.",
    source: { label: "Q4 planning notes" },
    createdAt: daysAgo(5),
    lastUsedAt: null,
    confidence: 0.38,
  },
  {
    id: "m7",
    kind: "project",
    content: "Migrating expense approvals from email to the new workflow by year end.",
    source: { label: "Expense workflow kickoff" },
    createdAt: daysAgo(12),
    lastUsedAt: daysAgo(3),
  },
]

/** Nothing is stored here; every action changes the list as your handlers would. */
export default function MemoryViewerDemo() {
  const [memories, setMemories] = React.useState(sampleMemories)

  return (
    <MemoryViewer
      className="max-w-xl"
      memories={memories}
      now={now}
      onEdit={(id, content) =>
        setMemories((current) => current.map((memory) => (memory.id === id ? { ...memory, content } : memory)))
      }
      onForget={(ids) => setMemories((current) => current.filter((memory) => !ids.includes(memory.id)))}
      onRestore={(restored) =>
        setMemories((current) =>
          // Put them back in their original order.
          sampleMemories.filter((memory) =>
            current.some((entry) => entry.id === memory.id) || restored.some((entry) => entry.id === memory.id)
          ).map((memory) => current.find((entry) => entry.id === memory.id) ?? memory)
        )
      }
      onPinnedChange={(id, pinned) =>
        setMemories((current) => current.map((memory) => (memory.id === id ? { ...memory, pinned } : memory)))
      }
    />
  )
}
