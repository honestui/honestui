"use client"

import * as React from "react"

import { TerminalOutput, type TerminalLine } from "@/registry/honest-ai/ai/terminal-output"

const script: TerminalLine[] = [
  { text: "> honest-app@0.4.0 build" },
  { text: "> next build" },
  { text: "" },
  { text: "   ▲ Next.js 16.0.0" },
  { text: "   Creating an optimized production build ..." },
  { text: " ✓ Compiled successfully in 4.2s" },
  { text: "   Linting and checking validity of types ..." },
  { text: " ⚠ Unused variable 'draft' in app/settings/page.tsx:18", stream: "stderr" },
  { text: "   Collecting page data ..." },
  { text: " ✓ Generating static pages (12/12)" },
  { text: "" },
  { text: "Route (app)                 Size     First Load JS" },
  { text: "┌ ○ /                       5.1 kB        102 kB" },
  { text: "├ ○ /invoices               8.4 kB        110 kB" },
  { text: "└ ƒ /api/export             142 B         96.9 kB" },
]

export default function TerminalOutputDemo() {
  const [count, setCount] = React.useState(0)
  const [startedAt] = React.useState(() => Date.now())
  const [finishedAt, setFinishedAt] = React.useState<number>()

  React.useEffect(() => {
    if (count >= script.length) return
    const timer = window.setTimeout(() => {
      setCount(count + 1)
      if (count + 1 === script.length) setFinishedAt(Date.now())
    }, count === 0 ? 400 : 280)
    return () => window.clearTimeout(timer)
  }, [count])

  const done = finishedAt !== undefined
  return (
    <div className="w-full max-w-2xl min-w-0">
      <TerminalOutput
        command="npm run build"
        lines={script.slice(0, count)}
        startedAt={startedAt}
        exitCode={done ? 0 : undefined}
        duration={done ? finishedAt - startedAt : undefined}
      />
    </div>
  )
}
