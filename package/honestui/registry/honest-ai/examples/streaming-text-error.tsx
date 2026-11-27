"use client"

import * as React from "react"

import { StreamingText, type StreamingTextStatus } from "@/registry/honest-ai/ai/streaming-text"

const partialText = "The migration adds a region column and then"
const fullText = "The migration adds a region column and then backfills 1,204 rows."

/** No request is made. Try again swaps in the full reply after a pause, as a second attempt would. */
export default function StreamingTextErrorExample() {
  const [status, setStatus] = React.useState<StreamingTextStatus>("error")
  const pending = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(pending.current), [])

  return (
    <div className="w-full max-w-lg min-w-0">
      <StreamingText
        status={status}
        labels={{ error: "The connection dropped, so this reply is incomplete." }}
        onRetry={() => {
          setStatus("streaming")
          pending.current = window.setTimeout(() => setStatus("complete"), 900)
        }}
      >
        {status === "complete" ? fullText : partialText}
      </StreamingText>
    </div>
  )
}
