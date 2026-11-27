"use client"

import * as React from "react"

import { PromptBar } from "@/registry/honest-ai/ai/prompt-bar"

const REPLY_MILLISECONDS = 6000

type Reply = { prompt: string; state: "pending" | "finished" | "stopped" }

/**
 * No model replies in this preview. A six-second timer stands in for a reply.
 * While it runs, Stop takes the place of Send, and pressing it clears the timer.
 */
export default function PromptBarStopExample() {
  const [reply, setReply] = React.useState<Reply | null>(null)
  const isPending = reply?.state === "pending"

  React.useEffect(() => {
    if (!isPending) return
    const timer = window.setTimeout(
      () => setReply((current) => current && { ...current, state: "finished" }),
      REPLY_MILLISECONDS
    )
    return () => window.clearTimeout(timer)
  }, [isPending])

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)]">
      <PromptBar
        placeholder="Write a message…"
        onStop={
          isPending
            ? () => setReply((current) => current && { ...current, state: "stopped" })
            : undefined
        }
        onSubmit={(submission) => setReply({ prompt: submission.text, state: "pending" })}
      />
      <p
        role="status"
        className="m-0 min-h-[var(--hui-space-5)] px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
      >
        {reply === null
          ? "Send a message, then press Stop while the reply is pending."
          : reply.state === "pending"
            ? `Waiting for a reply to “${reply.prompt}”…`
            : reply.state === "stopped"
              ? "onStop ran. The reply was stopped."
              : "The reply finished."}
      </p>
    </div>
  )
}
