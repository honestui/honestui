"use client"

import * as React from "react"
import { Check as CheckIcon, Copy as CopyIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import { ArtifactCard, ArtifactPanel } from "@/registry/honest-ai/ai/artifact-panel"
import { ChatMessage } from "@/registry/honest-ai/ai/chat-thread"
import { CodeView } from "@/registry/honest-ai/ai/code-view"

// Sample artifact.
const sampleCode = `type Row = { id: string; amount: number }

/** Rounds to cents once, after the rows are summed. */
function roundTotal(total: number) {
  return Math.round(total * 100) / 100
}

export function exportTotal(rows: Row[]) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  return roundTotal(total)
}`

const COPIED_MILLISECONDS = 1500

/** The panel's own Copy, since an embedded Code View has no header to hold one. */
function CopyButton({ text }: { text: string }) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle")
  const resetTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text)
            setState("copied")
          } catch {
            setState("failed")
          }
          window.clearTimeout(resetTimer.current)
          resetTimer.current = window.setTimeout(() => setState("idle"), COPIED_MILLISECONDS)
        }}
      >
        {state === "copied" ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
        Copy
      </Button>
      <span role="status" className={state === "failed" ? undefined : "sr-only"}>
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
      </span>
    </>
  )
}

/**
 * No agent wrote this file. The card in the reply opens the panel and shows
 * whether it is open, and closing the panel returns focus to the card.
 */
export default function ArtifactPanelDemo() {
  const [isOpen, setIsOpen] = React.useState(true)
  // The first render shows the panel without a press, so it must not take focus.
  const [wasOpenedByPerson, setWasOpenedByPerson] = React.useState(false)
  const cardRef = React.useRef<HTMLButtonElement>(null)

  return (
    <div className="flex w-full max-w-xl min-w-0 flex-col gap-[var(--hui-space-4)]">
      <ChatMessage role="assistant" author="Billing agent">
        <p className="m-0 mb-[var(--hui-space-3)]">
          Done. The rows are summed first, and the total is rounded to cents at the end.
        </p>
        <ArtifactCard
          ref={cardRef}
          title="export.ts"
          description="TypeScript, 11 lines"
          isOpen={isOpen}
          onClick={() => {
            setWasOpenedByPerson(true)
            setIsOpen(!isOpen)
          }}
        />
      </ChatMessage>
      {isOpen && (
        <div className="h-[19rem] min-w-0">
          <ArtifactPanel
            title="export.ts"
            description="TypeScript, 11 lines"
            flush
            autoFocus={wasOpenedByPerson}
            actions={<CopyButton text={sampleCode} />}
            onClose={() => {
              setIsOpen(false)
              cardRef.current?.focus()
            }}
          >
            <CodeView embedded filename="export.ts" code={sampleCode} />
          </ArtifactPanel>
        </div>
      )}
    </div>
  )
}
