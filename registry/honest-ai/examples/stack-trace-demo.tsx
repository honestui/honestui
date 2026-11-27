"use client"

import * as React from "react"

import { StackTrace, type StackFrame } from "@/registry/honest-ai/ai/stack-trace"

const stack = `TypeError: Cannot read properties of undefined (reading 'amount')
    at exportTotal (/workspace/honest-app/lib/export.ts:14:32)
    at Array.reduce (<anonymous>)
    at InvoiceSummary (/workspace/honest-app/app/invoices/summary.tsx:22:18)
    at renderWithHooks (/workspace/honest-app/node_modules/react-dom/cjs/react-dom-client.development.js:5541:22)
    at updateFunctionComponent (/workspace/honest-app/node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
    at beginWork (/workspace/honest-app/node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
    at async InvoicesPage (/workspace/honest-app/app/invoices/page.tsx:9:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)`

export default function StackTraceDemo() {
  const [opened, setOpened] = React.useState<StackFrame>()
  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-[var(--hui-space-3)]">
      <StackTrace stack={stack} onFrameClick={(frame) => setOpened(frame)} />
      <p
        aria-live="polite"
        className="m-0 min-h-4 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
      >
        {opened ? `Opened ${opened.file.replace("/workspace/honest-app/", "")}:${opened.line}` : ""}
      </p>
    </div>
  )
}
