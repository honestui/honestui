"use client"

import * as React from "react"

import { ChatMessage, ChatThread } from "@/registry/honest-ai/ai/chat-thread"
import { PromptBar } from "@/registry/honest-ai/ai/prompt-bar"

type Message = { id: number; role: "user" | "assistant"; text: string }

// Sample conversation.
const sampleMessages: Message[] = [
  { id: 1, role: "user", text: "Why are export totals off by a cent?" },
  {
    id: 2,
    role: "assistant",
    text: "Each row is rounded to cents before the rows are summed, so small remainders add up. On the March export, 412 rows each lost or gained a fraction of a cent, and together they moved the total by $0.01. Round once, after the sum, and the export matches the invoice ledger exactly.",
  },
]

/** No model replies here. A sent prompt is added to the thread as a user message. */
export default function ChatThreadDemo() {
  const [messages, setMessages] = React.useState(sampleMessages)

  return (
    <div className="h-[26rem] w-full max-w-lg min-w-0">
      <ChatThread
        label="Conversation with the billing agent"
        footer={
          <PromptBar
            placeholder="Write a message…"
            onSubmit={({ text }) =>
              setMessages((current) => [...current, { id: current.length + 1, role: "user", text }])
            }
          />
        }
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            author={message.role === "user" ? "You" : "Billing agent"}
          >
            {message.text}
          </ChatMessage>
        ))}
      </ChatThread>
    </div>
  )
}
