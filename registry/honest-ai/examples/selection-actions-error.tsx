"use client"

import * as React from "react"

import {
  SelectionActions,
  type SelectionActionsStatus,
} from "@/registry/honest-ai/ai/selection-actions"

/** Shows the error state. Try again returns to it, as a request that keeps failing would. */
export default function SelectionActionsErrorExample() {
  const [status, setStatus] = React.useState<SelectionActionsStatus>("error")
  const pending = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(pending.current), [])

  const fail = () => {
    setStatus("working")
    pending.current = window.setTimeout(() => setStatus("error"), 900)
  }

  return (
    <SelectionActions
      status={status}
      labels={{ error: "The edit did not finish. The text is unchanged." }}
      actions={[{ id: "improve", label: "Improve" }]}
      onAction={fail}
      onKeep={() => setStatus("idle")}
      onDiscard={() => setStatus("idle")}
      onRetry={fail}
    />
  )
}
