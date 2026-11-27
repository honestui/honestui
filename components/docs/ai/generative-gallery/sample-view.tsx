"use client";

import * as React from "react";

import {
  AssistantResponse,
  ArtifactPortalTarget,
  ChatProvider,
  agUIAdapter,
  type AssistantMessage,
  type ChatLLM,
} from "@/registry/honest-ai/generative/chat";
import { MapServicesContext, honestChatLibrary } from "@/registry/honest-ai/generative";
import { safeUrl } from "@/registry/honest-ai/generative/renderers/shared";
import { playgroundMapServices } from "@/components/docs/ai/playground/maps";
import { gallerySamples } from "./samples";

// The gallery has no model. Nothing reaches this, since every action is
// handled below, but the provider requires a transport.
const llm: ChatLLM = {
  streamProtocol: agUIAdapter(),
  send: async () => new Response("", { headers: { "Content-Type": "text/event-stream" } }),
};

const noSubscribe = () => () => {};

/** One fixed reply, rendered exactly as the chat renders a model's reply. */
export function GallerySampleView({ id }: { id: string }) {
  const sample = gallerySamples[id];
  // Generated image URLs must be absolute; the origin is known only in the browser.
  const origin = React.useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => null,
  );
  const [sent, setSent] = React.useState("");
  const message = React.useMemo<AssistantMessage | null>(
    () =>
      sample && origin
        ? { id: `gallery-${id}`, role: "assistant", content: sample.reply.replaceAll("{origin}", origin) }
        : null,
    [id, origin, sample],
  );
  if (!sample) return <p className="m-0 text-sm text-muted-foreground">No sample named “{id}”.</p>;
  return (
    <MapServicesContext.Provider value={playgroundMapServices}>
      <ChatProvider llm={llm}>
        <div data-slot="generative-sample" data-sample={id} className="@container grid w-full min-w-0 gap-3 p-4 sm:p-6">
          {message && (
            <AssistantResponse
              message={message}
              messages={[message]}
              streaming={false}
              rendererProps={{
                library: honestChatLibrary,
                onAction: (event) => {
                  const url = event.type === "open_url" ? safeUrl(event.params.url) : undefined;
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                  else setSent(event.humanFriendlyMessage);
                },
              }}
            />
          )}
          <p role="status" className={sent ? "m-0 text-xs text-muted-foreground" : "sr-only"}>
            {sent ? `In a chat, this sends “${sent}” to the assistant.` : ""}
          </p>
          <ArtifactPortalTarget className="fixed inset-0 z-50 flex bg-[var(--hui-color-background-base-primary)] p-3" />
        </div>
      </ChatProvider>
    </MapServicesContext.Provider>
  );
}
