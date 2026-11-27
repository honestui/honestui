import { ChatThread } from "@/registry/honest-ai/ai/chat-thread"

export default function ChatThreadEmptyExample() {
  return (
    <div className="h-56 w-full max-w-lg min-w-0">
      <ChatThread
        label="New conversation"
        emptyMessage="Ask about an invoice, an export, or a failed run."
      />
    </div>
  )
}
