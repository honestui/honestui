import { CodeView } from "@/registry/honest-ai/ai/code-view"

export default function CodeViewDiffExample() {
  return (
    <div className="w-full max-w-lg min-w-0">
      <CodeView
        filename="export.ts"
        diff={[
          { text: "function exportTotal(rows: Row[]) {" },
          { text: "  return rows.map(roundRow).reduce(sum, 0)", kind: "removed" },
          { text: "  const total = rows.reduce(sum, 0)", kind: "added" },
          { text: "  return roundTotal(total)", kind: "added" },
          { text: "}" },
        ]}
      />
    </div>
  )
}
