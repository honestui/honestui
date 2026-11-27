"use client"

import { ChatThread } from "@/registry/honest-ai/ai/chat-thread"
import { ChatWelcome } from "@/registry/honest-ai/ai/chat-welcome"

/** Inside ChatThread's empty state, the welcome gives way to the first message. */
export default function ChatWelcomeThread() {
  return (
    <div className="h-80 w-full max-w-lg min-w-0">
      <ChatThread
        label="New conversation"
        emptyMessage={
          <ChatWelcome
            title="New conversation"
            description="Ask about an invoice, an export, or a failed run."
            suggestionsLayout="list"
            suggestions={[
              { id: "a", label: "Why did last night's run fail?" },
              { id: "b", label: "Summarize open invoices" },
            ]}
            onSelectSuggestion={() => {}}
          />
        }
      />
    </div>
  )
}
