"use client"

import * as React from "react"

import { CheckpointList, type CheckpointItem } from "@/registry/honest-ai/ai/checkpoint"

// Sample checkpoints, newest first.
const sampleCheckpoints: CheckpointItem[] = [
  { id: "c4", label: "Tests updated for roundTotal", time: "2:31 PM", description: "3 files changed" },
  { id: "c3", label: "Call sites switched", time: "2:22 PM", description: "4 files changed" },
  { id: "c2", label: "Added the rounding helper", time: "2:16 PM", description: "1 file added" },
  { id: "c1", label: "Start of session", time: "2:14 PM", description: "Clean working tree" },
]

/** Several checkpoints in one panel. Restoring moves Current; nothing is undone here. */
export default function CheckpointListExample() {
  const [current, setCurrent] = React.useState("c4")

  return (
    <div className="w-full max-w-lg min-w-0">
      <CheckpointList
        title="Session history"
        checkpoints={sampleCheckpoints}
        currentId={current}
        onRestore={(id) =>
          new Promise<void>((resolve) =>
            window.setTimeout(() => {
              setCurrent(id)
              resolve()
            }, 700)
          )
        }
      />
    </div>
  )
}
