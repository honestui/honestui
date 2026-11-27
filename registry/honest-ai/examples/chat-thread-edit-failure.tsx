"use client"

import * as React from "react"

import { ChatMessage, ChatThread } from "@/registry/honest-ai/ai/chat-thread"

const SEND_MILLISECONDS = 600

/**
 * Nothing is sent. The first Send is rejected after a pause, as a failed
 * request would be, and the second one goes through.
 */
export default function ChatThreadEditFailureExample() {
  const [text, setText] = React.useState("Summarize the Q3 invoices.")
  const attempts = React.useRef(0)

  return (
    <div className="flex h-60 w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)]">
      <ChatThread label="Conversation with the billing agent" className="min-h-0 flex-1">
        <ChatMessage
          role="user"
          author="You"
          editText={text}
          onEdit={(edited) =>
            new Promise<void>((resolve, reject) => {
              window.setTimeout(() => {
                attempts.current += 1
                if (attempts.current === 1) {
                  reject(new Error("Sample failure"))
                  return
                }
                setText(edited)
                resolve()
              }, SEND_MILLISECONDS)
            })
          }
        >
          {text}
        </ChatMessage>
      </ChatThread>
      <p className="m-0 px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
        Point at the message, or press Tab to reach it, then choose Edit and Send.
      </p>
    </div>
  )
}
