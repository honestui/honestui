"use client"

import * as React from "react"

import {
  StreamingCitation,
  StreamingFollowUps,
  StreamingText,
  useSmoothStream,
  type StreamingTextFeedback,
} from "@/registry/honest-ai/ai/streaming-text"

// Sample reply, cut into the uneven chunks a real stream delivers.
const sampleChunks = [
  "A focus indicator needs ",
  "a contrast ratio of at least 3:1 against the colors ",
  "next to it. ",
  "The same ratio applies to the boundaries of controls.",
]
const sampleText = sampleChunks.join("")
// The preview opens with the first chunks already shown, as if the reply had started a moment ago.
const OPENING_CHUNKS = 2
const openingText = sampleChunks.slice(0, OPENING_CHUNKS).join("")

const sampleSources = [
  {
    href: "https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html",
    title: "Understanding Focus Appearance",
    domain: "w3.org",
  },
  {
    href: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html",
    title: "Understanding Non-text Contrast",
    domain: "w3.org",
  },
]

const CHUNK_MILLISECONDS = 420

/**
 * No model streams into this preview. A timer delivers one chunk at a time,
 * as a network would, and `useSmoothStream` paces what has arrived so it
 * appears at a steady rate. Try again restarts the timer. The line at the
 * bottom shows what each handler received.
 */
export default function StreamingTextDemo() {
  const [chunkCount, setChunkCount] = React.useState(OPENING_CHUNKS)
  const [received, setReceived] = React.useState("")
  const hasAllChunks = chunkCount >= sampleChunks.length
  const stream = useSmoothStream(sampleChunks.slice(OPENING_CHUNKS, chunkCount).join(""))
  const isComplete = hasAllChunks && stream.isSettled

  React.useEffect(() => {
    if (hasAllChunks) return
    const timer = window.setTimeout(() => setChunkCount((count) => count + 1), CHUNK_MILLISECONDS)
    return () => window.clearTimeout(timer)
  }, [chunkCount, hasAllChunks])

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)]">
      <StreamingText
        status={isComplete ? "complete" : "streaming"}
        copyText={sampleText}
        sources={sampleSources}
        onRetry={() => {
          setReceived("")
          setChunkCount(OPENING_CHUNKS)
        }}
        onFeedbackChange={(feedback: StreamingTextFeedback) =>
          setReceived(`onFeedbackChange received ${JSON.stringify(feedback)}`)
        }
      >
        {openingText}
        {stream.text}
        {isComplete && (
          <>
            {" "}
            <StreamingCitation href={sampleSources[1].href}>w3.org</StreamingCitation>
          </>
        )}
      </StreamingText>
      {isComplete && (
        <StreamingFollowUps
          prompts={["Which tokens fail that ratio?", "Show the ring on a dark surface"]}
          onSelect={(prompt) => setReceived(`onSelect received “${prompt}”`)}
        />
      )}
      <p
        role="status"
        className="m-0 min-h-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
      >
        {received}
      </p>
    </div>
  )
}
