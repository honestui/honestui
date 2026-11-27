"use client"

import { EvalCompare, type EvalCandidate } from "@/registry/honest-ai/ai/eval-compare"

// Two versions of a release-notes prompt, compared word by word.
const candidates: EvalCandidate[] = [
  {
    id: "v1",
    label: "Prompt v1",
    meta: "Current",
    output:
      "We improved search so it is faster and more accurate. Exports now support CSV and Excel. Fixed a bug where some users could not log in.",
  },
  {
    id: "v2",
    label: "Prompt v2",
    meta: "Plain language, no filler",
    output:
      "Search results load twice as fast. Exports now support CSV, Excel, and Google Sheets. Fixed a bug that signed some people out after a password change.",
  },
]

export default function EvalCompareDiff() {
  return (
    <EvalCompare
      className="max-w-3xl"
      prompt="Write three lines of release notes from these merged pull requests."
      candidates={candidates}
      defaultDiff
    />
  )
}
