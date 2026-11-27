import {
  EventType,
  type ChatLLM,
  type Message,
  type StreamProtocolAdapter,
} from "@/registry/honest-ai/generative/chat";
import { sseLineIterator } from "@/registry/honest-ai/generative/runtime/headless/stream/adapters/_shared/sseLines";

/** The browser talks to the visitor's own Ollama. No server sits in between. */
export const OLLAMA_URL = "http://localhost:11434";

/**
 * The chat library prompt is about 14,000 tokens. Ollama's default context can
 * be as small as 4,096 and drops the oldest tokens to fit, which would remove
 * the instructions. This leaves room for the prompt and a long conversation.
 */
export const CONTEXT_TOKENS = 32_768;

export type OllamaModel = {
  name: string;
  /** Such as "20.9B". Ollama omits it for some models. */
  parameterSize?: string;
};

type TagsResponse = {
  models?: {
    name: string;
    details?: { parameter_size?: string };
    /** Older Ollama versions do not report capabilities. */
    capabilities?: string[];
  }[];
};

/** The installed models that can chat. Embedding-only models are left out. */
export async function listOllamaModels(
  signal?: AbortSignal,
): Promise<OllamaModel[]> {
  const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal });
  if (!response.ok) {
    throw new Error(`Ollama answered ${response.status} ${response.statusText}`);
  }
  const { models = [] } = (await response.json()) as TagsResponse;
  return models
    .filter(
      (model) =>
        !model.capabilities || model.capabilities.includes("completion"),
    )
    .map((model) => ({
      name: model.name,
      parameterSize: model.details?.parameter_size || undefined,
    }));
}

type ChatChunk = {
  message?: { content?: string };
  done?: boolean;
  error?: string;
  /** Tokens in the prompt and in the reply. Only the last chunk carries them. */
  prompt_eval_count?: number;
  eval_count?: number;
};

/**
 * Reads Ollama's newline-delimited `/api/chat` stream. `onContextUsed` gets
 * the tokens the conversation fills once a reply ends, as Ollama counted them.
 */
const ollamaStream = (
  onContextUsed?: (tokens: number) => void,
): StreamProtocolAdapter => ({
  async *parse(response) {
    const messageId = crypto.randomUUID();
    let started = false;

    for await (const line of sseLineIterator(response)) {
      const chunk = JSON.parse(line) as ChatChunk;
      if (chunk.error) throw new Error(chunk.error);

      const delta = chunk.message?.content;
      if (delta) {
        if (!started) {
          started = true;
          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId,
            role: "assistant",
          };
        }
        yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta };
      }
      if (chunk.done && started) {
        yield { type: EventType.TEXT_MESSAGE_END, messageId };
      }
      if (
        chunk.done &&
        chunk.prompt_eval_count !== undefined &&
        chunk.eval_count !== undefined
      ) {
        onContextUsed?.(chunk.prompt_eval_count + chunk.eval_count);
      }
    }
  },
});

function toOllamaMessages(messages: Message[]) {
  return messages.flatMap((message) =>
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
      ? [{ role: message.role, content: message.content }]
      : [],
  );
}

export function createOllamaLLM({
  model,
  systemPrompt,
  onContextUsed,
}: {
  model: string;
  systemPrompt: string;
  onContextUsed?: (tokens: number) => void;
}): ChatLLM {
  return {
    streamProtocol: ollamaStream(onContextUsed),
    send: ({ messages, signal }) =>
      fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: true,
          options: { num_ctx: CONTEXT_TOKENS },
          messages: [
            { role: "system", content: systemPrompt },
            ...toOllamaMessages(messages),
          ],
        }),
        signal,
      }),
  };
}
