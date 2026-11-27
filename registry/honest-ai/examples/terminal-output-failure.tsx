"use client"

import { TerminalOutput, type TerminalLine } from "@/registry/honest-ai/ai/terminal-output"

const passing = Array.from({ length: 24 }, (_, index) => ({
  text: ` ✓ src/lib/invoice-${String(index + 1).padStart(2, "0")}.test.ts (${(index % 5) + 2} tests)`,
}))

const lines: TerminalLine[] = [
  { text: " RUN  v3.2.4 /workspace/honest-app" },
  { text: "" },
  ...passing,
  { text: " ✗ src/lib/export.test.ts > exportTotal > rounds to cents", stream: "stderr" },
  { text: "   AssertionError: expected 10.004999 to be 10.01", stream: "stderr" },
  { text: "    ❯ src/lib/export.test.ts:14:32", stream: "stderr" },
  { text: "" },
  { text: " Test Files  1 failed | 24 passed (25)" },
  { text: "      Tests  1 failed | 87 passed (88)" },
]

export default function TerminalOutputFailure() {
  return (
    <div className="w-full max-w-2xl min-w-0">
      <TerminalOutput command="npx vitest run" cwd="~/honest-app" lines={lines} exitCode={1} duration={3840} collapsedLines={8} />
    </div>
  )
}
