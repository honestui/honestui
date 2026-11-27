"use client"

import * as React from "react"

import { TranscriptViewer, type TranscriptSegment } from "@/registry/honest-ai/ai/transcript-viewer"

// Sample lines with made-up timings.
const segments: TranscriptSegment[] = [
  { id: "a", speaker: "Sam", start: 0, end: 5, text: "Let's go through the rollout plan for the new export." },
  { id: "b", speaker: "Assistant", start: 5.5, end: 12, text: "The export ships behind a flag. Ten percent of workspaces get it on Monday." },
  { id: "c", speaker: "Assistant", start: 12.2, end: 17, text: "If error rates hold, the flag goes to everyone on Thursday." },
  { id: "d", speaker: "Sam", start: 17.5, end: 21, text: "What happens to scheduled exports already in the queue?" },
  { id: "e", speaker: "Assistant", start: 21.4, end: 28, text: "Queued exports finish on the old path. Only exports created after the flag flips use the new one." },
  { id: "f", speaker: "Sam", start: 28.5, end: 31, text: "And the flag can be turned off at any point?" },
  { id: "g", speaker: "Assistant", start: 31.4, end: 36, text: "Yes. Turning the flag off sends new exports back to the old path within a minute." },
]

/** A finished transcript with search. Press Enter in the field for the next match, Shift+Enter for the previous one. */
export default function TranscriptViewerSearch() {
  const [time, setTime] = React.useState(0)

  return (
    <div className="w-full max-w-[34rem]">
      <TranscriptViewer
        segments={segments}
        currentTime={time}
        onSeek={setTime}
        follow={false}
        searchable
        className="h-[18rem]"
      />
    </div>
  )
}
