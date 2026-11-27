"use client"

import * as React from "react"
import { z } from "zod"

import { Flowchart, FlowStep } from "@/registry/honest-ai/ai/flowchart"
import { Markdown, type MarkdownBlockRenderer } from "@/registry/honest-ai/ai/markdown"
import { StreamingText } from "@/registry/honest-ai/ai/streaming-text"

const flowchartSchema = z.object({
  label: z.string(),
  steps: z.array(z.object({ kind: z.string(), title: z.string(), caption: z.string().optional() })).min(1),
})

// The fence's text comes from the model, so it is checked before it is drawn.
// When it does not fit the schema, `parse` throws and Markdown shows the text as code.
const blocks: Record<string, MarkdownBlockRenderer> = {
  flowchart(body) {
    const { label, steps } = flowchartSchema.parse(JSON.parse(body))
    return (
      <Flowchart label={label}>
        {steps.map((step) => (
          <FlowStep key={step.title} kind={step.kind} title={step.title} caption={step.caption} />
        ))}
      </Flowchart>
    )
  },
}

// Sample reply.
const sampleReply = `The follow-up runs as **three steps**:

\`\`\`flowchart
{
  "label": "Invoice follow-up workflow",
  "steps": [
    { "kind": "Trigger", "title": "Invoice becomes overdue", "caption": "Runs the day after the due date." },
    { "kind": "Condition", "title": "If the amount is over 1,000", "caption": "Larger invoices go to a person first." },
    { "kind": "Action", "title": "Draft a reminder email", "caption": "Waits for approval." }
  ]
}
\`\`\`

Nothing is sent until someone approves the draft.
`

// The first sentence arrives whole, so the preview opens on readable text. The
// rest is cut into uneven pieces, so the block's data arrives half-written as it does from a model.
const openingText = sampleReply.slice(0, sampleReply.indexOf("```"))
const sampleChunks = [openingText, ...(sampleReply.slice(openingText.length).match(/[\s\S]{1,31}/g) ?? [])]

const CHUNK_MILLISECONDS = 140

/**
 * No model streams into this preview. A timer delivers the sample reply a
 * piece at a time. Try again restarts the timer.
 */
export default function MarkdownBlocksExample() {
  const [chunkCount, setChunkCount] = React.useState(1)
  const isComplete = chunkCount >= sampleChunks.length

  React.useEffect(() => {
    if (isComplete) return
    const timer = window.setTimeout(() => setChunkCount((count) => count + 1), CHUNK_MILLISECONDS)
    return () => window.clearTimeout(timer)
  }, [chunkCount, isComplete])

  return (
    <div className="w-full max-w-lg min-w-0">
      <StreamingText
        status={isComplete ? "complete" : "streaming"}
        // The text changes several times a second, which is too much to announce.
        announce={false}
        onRetry={() => setChunkCount(1)}
      >
        <Markdown isStreaming={!isComplete} blocks={blocks}>
          {sampleChunks.slice(0, chunkCount).join("")}
        </Markdown>
      </StreamingText>
    </div>
  )
}
