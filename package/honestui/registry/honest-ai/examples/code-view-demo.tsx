import { CodeView } from "@/registry/honest-ai/ai/code-view"

const sampleCode = `function exportTotal(rows: Row[]) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  return roundTotal(total)
}`

export default function CodeViewDemo() {
  return (
    <div className="w-full max-w-lg min-w-0">
      <CodeView className="[&_pre]:no-scrollbar" filename="export.ts" code={sampleCode} />
    </div>
  )
}
