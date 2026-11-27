import {
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
  type ChatLLM,
  type StreamProtocolAdapter,
} from "@/registry/honest-ai/generative/chat";
import { sseLineIterator } from "@/registry/honest-ai/generative/runtime/headless/stream/adapters/_shared/sseLines";

type UsageChunk = { usage?: { total_tokens?: number } | null };

/** The tokens the provider counted, from the stream's last chunk. */
async function readTotalTokens(response: Response) {
  let total: number | undefined;
  for await (const line of sseLineIterator(response)) {
    if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
    try {
      const tokens = (JSON.parse(line.slice(6)) as UsageChunk).usage
        ?.total_tokens;
      if (typeof tokens === "number") total = tokens;
    } catch {
      // The reply's own reader reports chunks that cannot be parsed.
    }
  }
  return total;
}

/** An OpenAI-compatible stream, with usage read from a copy of the response. */
const hostedStream = (
  onContextUsed: (tokens: number) => void,
): StreamProtocolAdapter => {
  const reply = openAIAdapter();
  return {
    async *parse(response) {
      void readTotalTokens(response.clone()).then(
        (tokens) => {
          if (tokens !== undefined) onContextUsed(tokens);
        },
        // A stopped reply ends the copy too, with nothing counted.
        () => {},
      );
      yield* reply.parse(response);
    },
  };
};

/** Replies come from this site's server, which holds the model credentials. */
export function createHostedLLM({
  onContextUsed,
  model,
}: {
  onContextUsed: (tokens: number) => void;
  model?: string;
}): ChatLLM {
  return fetchLLM({
    url: "/api/playground/chat",
    streamAdapter: hostedStream(onContextUsed),
    messageFormat: openAIMessageFormat,
    body: model ? { model } : undefined,
  });
}
