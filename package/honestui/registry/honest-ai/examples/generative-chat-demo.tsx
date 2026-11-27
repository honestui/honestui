"use client";
import {
  GenerativeChat,
  agUIAdapter,
  type ChatLLM,
  EventType,
} from "@/registry/honest-ai/generative/chat";
const llm: ChatLLM = {
  streamProtocol: agUIAdapter(),
  send: async ({ messages, signal }) => {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const last = messages.findLast((message) => message.role === "user");
    const input = typeof last?.content === "string" ? last.content : "";
    // The reply is Markdown. The fenced block is the part drawn as components.
    const reply = [
      "No model is connected. The callout below is generated from an `honestai` block in this reply.",
      "",
      "```honestai",
      "root = Stack([echo])",
      `echo = Callout("info", "Local example response", ${JSON.stringify(`You sent: ${input}`)})`,
      "```",
    ].join("\n");
    const id = crypto.randomUUID();
    const events = [
      { type: EventType.TEXT_MESSAGE_START, messageId: id, role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: id, delta: reply },
      { type: EventType.TEXT_MESSAGE_END, messageId: id },
    ];
    return new Response(
      events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""),
      { headers: { "Content-Type": "text/event-stream" } },
    );
  },
};
export default function GenerativeChatDemo() {
  return (
    <div data-slot="generative-chat-demo" className="grid w-full gap-3 p-4">
      <p className="m-0 text-sm text-muted-foreground">
        This local transport echoes your message in a Markdown reply with one
        generated component. It makes no model or server request. Conversation
        history lasts until this preview is unmounted.
      </p>
      <div className="h-[34rem]">
        <GenerativeChat llm={llm} label="Local generative chat example" />
      </div>
    </div>
  );
}
