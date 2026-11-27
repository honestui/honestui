"use client"

import "katex/dist/katex.min.css"

import { Download as DownloadIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import { Markdown, type MarkdownCodeBlock } from "@/registry/honest-ai/ai/markdown"
import { mathPlugins, normalizeMathDelimiters } from "@/registry/honest-ai/lib/markdown-math"

function downloadCode({ code, title }: MarkdownCodeBlock) {
  const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }))
  const link = document.createElement("a")
  link.href = url
  link.download = title ?? "code.txt"
  link.click()
  URL.revokeObjectURL(url)
}

function renderCodeActions(block: MarkdownCodeBlock) {
  return (
    <Button variant="link" size="sm" onClick={() => downloadCode(block)}>
      <DownloadIcon aria-hidden="true" />
      Download
    </Button>
  )
}

// Sample document. The math uses the LaTeX delimiters models tend to write.
const sampleDocument = String.raw`Rounding each of \(n\) rows can move the total by up to half a cent per row:

\[
\left| \sum_{i=1}^{n} \operatorname{round}(a_i) - \operatorname{round}\Bigl(\sum_{i=1}^{n} a_i\Bigr) \right| \le \frac{n + 1}{2} \cdot 0.01
\]

Summing first removes the drift. A price such as $5 is left as text.

${"```"}ts title="export.ts"
function exportTotal(rows: Row[]) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  return roundTotal(total)
}
${"```"}
`

const source = normalizeMathDelimiters(sampleDocument)

export default function MarkdownAddOnsExample() {
  return (
    <div className="w-full max-w-lg min-w-0">
      <Markdown {...mathPlugins} renderCodeActions={renderCodeActions}>
        {source}
      </Markdown>
    </div>
  )
}
