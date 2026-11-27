"use client"

import { FilterTable } from "@/registry/honest-ai/ai/filter-table"

type AgentTask = { id: string; task: string; owner: string; status: "todo" | "running" | "done" }

// Sample tasks.
const sampleTasks: AgentTask[] = [
  { id: "1", task: "Reconcile March invoices", owner: "Billing agent", status: "running" },
  { id: "2", task: "Draft supplier emails", owner: "Outreach agent", status: "todo" },
  { id: "3", task: "Update the runbook", owner: "Docs agent", status: "done" },
  { id: "4", task: "Triage new tickets", owner: "Support agent", status: "running" },
  { id: "5", task: "Archive stale threads", owner: "Support agent", status: "todo" },
]

const statusLabel = { todo: "To do", running: "In progress", done: "Completed" }
// Status is a small dot and a word; only the dot carries the tone, so the
// column stays calm. Status is not an interaction, so it stays off accent.
const statusDot = {
  todo: "bg-[var(--hui-color-foreground-base-tertiary)]",
  running: "bg-[var(--hui-color-foreground-attention-primary)]",
  done: "bg-[var(--hui-color-foreground-base-primary)]",
}

export default function FilterTableDemo() {
  return (
    <div className="w-full max-w-lg min-w-0">
      <FilterTable
        label="Agent tasks"
        rows={sampleTasks}
        getRowId={(row) => row.id}
        columns={[
          { id: "task", header: "Task", cell: (row) => row.task },
          { id: "owner", header: "Owner", cell: (row) => row.owner },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <span className="inline-flex items-center gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]">
                <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${statusDot[row.status]}`} />
                {statusLabel[row.status]}
              </span>
            ),
          },
        ]}
        filters={[
          { id: "todo", label: "To do", matches: (row) => row.status === "todo" },
          { id: "running", label: "In progress", matches: (row) => row.status === "running" },
          { id: "done", label: "Completed", matches: (row) => row.status === "done" },
          { id: "blocked", label: "Blocked", matches: () => false },
        ]}
      />
    </div>
  )
}
