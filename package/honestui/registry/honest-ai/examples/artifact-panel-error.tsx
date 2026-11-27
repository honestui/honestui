"use client"

import * as React from "react"

import { ArtifactPanel, type ArtifactStatus } from "@/registry/honest-ai/ai/artifact-panel"
import { Markdown } from "@/registry/honest-ai/ai/markdown"

const partialText = "## Release note\n\nExport totals are now rounded once, after"
const fullText =
  "## Release note\n\nExport totals are now rounded once, after the rows are summed. Totals on 1,204 past invoices change by one cent."

/** No request is made. Try again swaps in the full text after a pause, as a second attempt would. */
export default function ArtifactPanelErrorExample() {
  const [status, setStatus] = React.useState<ArtifactStatus>("error")
  const pending = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(pending.current), [])

  return (
    <div className="h-64 w-full max-w-md min-w-0">
      <ArtifactPanel
        title="Release note"
        description="Draft"
        status={status}
        labels={{ error: "The connection dropped, so this draft is incomplete." }}
        onRetry={() => {
          setStatus("streaming")
          pending.current = window.setTimeout(() => setStatus("complete"), 900)
        }}
      >
        <Markdown isStreaming={status === "streaming"}>
          {status === "complete" ? fullText : partialText}
        </Markdown>
      </ArtifactPanel>
    </div>
  )
}
