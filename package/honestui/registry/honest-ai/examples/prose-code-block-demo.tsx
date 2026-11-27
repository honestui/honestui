"use client"

import { ProseCodeBlock } from "@/registry/honest-ai/ai/prose-code-block"
import { SyntaxLine, useSyntax } from "@/registry/honest-ai/lib/prose-syntax-react"

const sampleCode = `function exportTotal(rows: Row[]) {
  // Sum first, then round once.
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  return roundTotal(total)
}`

export default function ProseCodeBlockDemo() {
  const syntax = useSyntax(sampleCode, "ts")
  return (
    <div className="w-full max-w-lg min-w-0">
      <ProseCodeBlock
        label="export.ts"
        code={sampleCode}
        codeClassName="honest-syntax"
        renderLine={syntax ? (line, index) => (syntax.lines[index] ? <SyntaxLine tokens={syntax.lines[index]} /> : line) : undefined}
      />
    </div>
  )
}
