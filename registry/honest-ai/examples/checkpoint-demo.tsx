"use client"

import * as React from "react"

import { Checkpoint, type CheckpointStatus } from "@/registry/honest-ai/ai/checkpoint"

const bubble =
  "m-0 max-w-[85%] rounded-[var(--hui-radius-4)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] [font-size:var(--hui-font-size-regular)] [line-height:20px]"

/**
 * A checkpoint between two turns. Nothing is undone here; Restore waits a
 * moment, as your app would while it puts the files back.
 */
export default function CheckpointDemo() {
  const [status, setStatus] = React.useState<CheckpointStatus>("available")

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-primary)]">
      <p className={`${bubble} self-end bg-[var(--hui-color-background-neutral-secondary)]`}>
        Move the invoice rounding into a single helper and update the tests.
      </p>
      <Checkpoint
        label="Before the rounding refactor"
        time="2:14 PM"
        dateTime="2026-11-26T14:14"
        status={status}
        onRestore={() => {
          setStatus("restoring")
          return new Promise<void>((resolve) =>
            window.setTimeout(() => {
              setStatus("restored")
              resolve()
            }, 900)
          )
        }}
      />
      <p className={`${bubble} self-start px-0 text-[var(--hui-color-foreground-base-primary)]`}>
        {status === "restored"
          ? "The workspace is back to how it was at 2:14 PM. The rounding helper and its tests were removed."
          : "Added roundTotal in src/billing/round.ts and switched four call sites to it. The invoice tests pass."}
      </p>
    </div>
  )
}
