import {
  FileText as FileTextIcon,
  Pencil as PencilIcon,
  Terminal as TerminalIcon,
} from "honestui/icons"

import { ToolChips, type FileChange, type ToolCall } from "@/registry/honest-ai/ai/tool-chips"

// Sample run.
const sampleCalls: ToolCall[] = [
  {
    id: "read",
    label: "Read",
    detail: "export.ts",
    detailIsCode: true,
    icon: <FileTextIcon />,
    output: [
      { text: "148 lines. Totals are rounded per row, before they are summed." },
    ],
  },
  {
    id: "edit",
    label: "Edit",
    detail: "export.ts",
    detailIsCode: true,
    icon: <PencilIcon />,
    outputIsCode: true,
    output: [
      { text: "const total = rows.reduce(sum, 0)", kind: "context" },
      { text: "return rows.map(roundRow)", kind: "removed" },
      { text: "return roundTotal(total)", kind: "added" },
    ],
  },
  {
    id: "test",
    label: "Run",
    detail: "npm test -- export",
    detailIsCode: true,
    icon: <TerminalIcon />,
    outputIsCode: true,
    output: [{ text: "14 passed, 0 failed" }],
  },
]

const sampleChanges: FileChange[] = [
  {
    path: "export.ts",
    added: 6,
    removed: 4,
    lines: [
      { text: "const total = rows.reduce(sum, 0)", kind: "context" },
      { text: "return rows.map(roundRow)", kind: "removed" },
      { text: "return roundTotal(total)", kind: "added" },
    ],
  },
  {
    path: "export.test.ts",
    added: 22,
    removed: 0,
    lines: [
      { text: "it(\"rounds the total once\", () => {", kind: "added" },
      { text: "  expect(exportTotal(rows)).toBe(10.01)", kind: "added" },
      { text: "})", kind: "added" },
    ],
  },
  { path: "CHANGELOG.md", added: 1, removed: 0 },
  { path: "rounding.ts", added: 9, removed: 0 },
]

export default function ToolChipsDemo() {
  return (
    <div className="w-full max-w-sm min-w-0">
      <ToolChips summary="3 tool calls" calls={sampleCalls} changes={sampleChanges} />
    </div>
  )
}
