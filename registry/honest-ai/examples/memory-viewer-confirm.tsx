"use client"

import * as React from "react"

import { MemoryViewer, type MemoryItem } from "@/registry/honest-ai/ai/memory-viewer"

const now = new Date("2026-11-26T15:00:00Z")
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000)

// A workspace agent's project memory. Forgetting here is final, so it asks first.
const sampleMemories: MemoryItem[] = [
  {
    id: "p1",
    kind: "project",
    content: "The mobile app ships every second Tuesday; the freeze starts the Thursday before.",
    source: { label: "Release process" },
    createdAt: daysAgo(90),
    lastUsedAt: daysAgo(4),
  },
  {
    id: "p2",
    kind: "project",
    content: "Payments code needs a review from someone on the platform team.",
    source: { label: "CODEOWNERS discussion" },
    createdAt: daysAgo(51),
    lastUsedAt: daysAgo(11),
  },
  {
    id: "p3",
    kind: "project",
    content: "The staging database is reset every Sunday night.",
    source: { label: "Flaky test thread" },
    createdAt: daysAgo(8),
    lastUsedAt: null,
    confidence: 0.44,
  },
]

const groups = [{ kind: "project", label: "Checkout team" }]

export default function MemoryViewerConfirm() {
  const [memories, setMemories] = React.useState(sampleMemories)

  return (
    <MemoryViewer
      className="max-w-xl"
      memories={memories}
      groups={groups}
      now={now}
      labels={{ title: "Team memory" }}
      onForget={(ids) => setMemories((current) => current.filter((memory) => !ids.includes(memory.id)))}
    />
  )
}
