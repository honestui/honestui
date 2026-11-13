"use client"

import * as React from "react"

import {
  ActionButton,
  ActionStatus,
  useAsyncAction,
} from "@/registry/default/product/async-action/async-action"

/** A timer that stops when the signal aborts, as a fetch given the same signal would. */
function waitUnlessAborted(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds)
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer)
      reject(signal.reason)
    })
  })
}

/**
 * There is no server behind this preview and no file is created. The count
 * shows how many requests began, so repeated clicks can be seen to start one.
 */
export default function AsyncActionCancelExample() {
  const [requestsStarted, setRequestsStarted] = React.useState(0)

  const exportReport = useAsyncAction({
    action: (_input: void, { signal }) => {
      setRequestsStarted((count) => count + 1)
      return waitUnlessAborted(4000, signal)
    },
    cancelable: true,
  })

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-3)]">
      <div className="flex min-w-0 items-center justify-between gap-[var(--hui-space-4)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)]">
        <div className="flex min-w-0 flex-col">
          <span className="text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:20px]">Monthly usage report</span>
          <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
            CSV · All workspaces · October
          </span>
        </div>
        <ActionButton
          action={exportReport}
          pendingLabel="Exporting…"
          size="sm"
          className="shrink-0 px-[var(--hui-space-4)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)]"
        >
          Export report
        </ActionButton>
      </div>
      <ActionStatus
        action={exportReport}
        labels={{
          pending: "Preparing the export…",
          success: "Export finished. This preview does not create a file.",
          cancelled: "Export cancelled.",
        }}
      />
      <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] tabular-nums [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
        Requests started: {requestsStarted}
      </p>
    </div>
  )
}
