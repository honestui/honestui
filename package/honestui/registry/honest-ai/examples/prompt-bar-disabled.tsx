"use client"

import * as React from "react"

import { PromptBar } from "@/registry/honest-ai/ai/prompt-bar"

const REPLY_MILLISECONDS = 2000

/**
 * No model replies in this preview. A two-second timer stands in for a
 * streaming reply, and the bar is disabled until it ends.
 */
export default function PromptBarDisabledExample() {
  const [pendingPrompt, setPendingPrompt] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (pendingPrompt === null) return
    const timer = window.setTimeout(() => setPendingPrompt(null), REPLY_MILLISECONDS)
    return () => window.clearTimeout(timer)
  }, [pendingPrompt])

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)]">
      <PromptBar
        placeholder="Write a message…"
        disabled={pendingPrompt !== null}
        onSubmit={(submission) => setPendingPrompt(submission.text)}
      />
      <p
        role="status"
        className="m-0 min-h-[var(--hui-space-5)] px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
      >
        {pendingPrompt === null
          ? "Send a message. The bar stays disabled until the reply ends."
          : `Waiting for a reply to “${pendingPrompt}”…`}
      </p>
    </div>
  )
}
