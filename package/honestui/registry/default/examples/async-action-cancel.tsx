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
    <div className="flex w-full max-w-md min-w-0 flex-col items-start gap-[var(--hui-space-4)]">
      <ActionButton action={exportReport} pendingLabel="Exporting…">
        Export report
      </ActionButton>
      <ActionStatus
        action={exportReport}
        labels={{
          pending: "Preparing the export…",
          success: "Export finished. This preview does not create a file.",
          cancelled: "Export cancelled.",
        }}
      />
      <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]">
        Requests started: {requestsStarted}
      </p>
    </div>
  )
}
