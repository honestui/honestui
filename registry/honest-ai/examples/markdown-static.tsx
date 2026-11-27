import { Markdown } from "@/registry/honest-ai/ai/markdown"

// Sample document.
const sampleDocument = `## Release checklist

The export fix is ready. ~~Ship on Friday~~ Ship on Monday, after the backfill.

- [x] Round the total once
- [x] Add a test for three rows of 0.336
- [ ] Backfill the 1,204 affected invoices

> Totals already sent to customers are not changed by the backfill.

The chart of the drift is an image, so it is shown as a link:
![Drift per export, by month](https://example.com/drift.png)
`

export default function MarkdownStaticExample() {
  return (
    <div className="w-full max-w-lg min-w-0">
      <Markdown>{sampleDocument}</Markdown>
    </div>
  )
}
