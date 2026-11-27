"use client"

import * as React from "react"

import { TaskRows, type Task } from "@/registry/honest-ai/ai/task-rows"

// Sample tasks.
const sampleTasks: Task[] = [
  {
    id: "verify",
    label: "Verify vendor records",
    summary: "12 suppliers",
    status: "done",
    details: [
      { label: "Matched tax and contact IDs", value: "12/12" },
      { label: "Flagged stale records", value: "0" },
    ],
  },
  {
    id: "reorder",
    label: "Build the reorder list",
    summary: "7 SKUs",
    status: "running",
    details: [
      { label: "Reading the POS export", value: "3 files" },
      { label: "Scoring stockout risk", value: "68%" },
    ],
  },
  { id: "emails", label: "Draft supplier emails", summary: "2 messages", status: "error" },
  { id: "summary", label: "Write the summary", status: "queued" },
]

/**
 * One plate, one row per task. No agent runs here. Try again moves the failed
 * task to running, as your handler would.
 */
export default function TaskRowsDemo() {
  const [tasks, setTasks] = React.useState(sampleTasks)

  return (
    <div className="w-full max-w-[36rem] min-w-0">
      <TaskRows
        variant="list"
        tasks={tasks}
        onRetry={(taskId) =>
          setTasks((current) =>
            current.map((task) => (task.id === taskId ? { ...task, status: "running" } : task))
          )
        }
      />
    </div>
  )
}
