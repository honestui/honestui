"use client";

import { ChatMessage } from "@/registry/honest-ai/ai/chat-thread";
import { MessageScroller } from "@/registry/honest-ai/ai/message-scroller";

// Static sample content. This preview does not call a model.
const messages = [
  { role: "user", text: "What is a DNS resolver?" },
  { role: "assistant", text: "A resolver looks up the IP address for a domain name. It checks its cache first, then asks DNS servers when it needs a fresh answer." },
  { role: "user", text: "What happens when the cache is empty?" },
  { role: "assistant", text: "The resolver follows the DNS hierarchy: a root server points it to a top-level domain server, which points it to the domain's authoritative server." },
  { role: "user", text: "How long does an answer stay cached?" },
  { role: "assistant", text: "A record's time to live, or TTL, tells a resolver how long it can reuse the answer. Once that time expires, the resolver needs a fresh lookup." },
  { role: "user", text: "Can I read an earlier answer while the conversation grows?" },
  { role: "assistant", text: "Scroll up or select an earlier message using the rail on the right. Select the last tick to return to the newest message. Hover or focus a tick to preview its message." },
] as const;

export default function MessageScrollerDemo() {
  return (
    <div className="w-full max-w-xl min-w-0">
      <MessageScroller
        label="Sample conversation"
        navigation="rail"
        viewportClassName="no-scrollbar"
        className="h-96 rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)]"
        contentClassName="flex flex-col gap-[var(--hui-space-6)] p-[var(--hui-space-6)] pe-[var(--hui-space-10)]"
      >
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            data-slot="message"
            data-from={message.role}
            role={message.role}
            author={message.role === "user" ? "You" : "Assistant"}
            hideAuthor
          >
            <div data-slot="message-content">{message.text}</div>
          </ChatMessage>
        ))}
      </MessageScroller>
    </div>
  );
}
