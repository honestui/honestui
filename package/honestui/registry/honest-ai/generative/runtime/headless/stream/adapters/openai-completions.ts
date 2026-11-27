// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";
import { sseLineIterator } from "./_shared/sseLines";

export const openAIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const messageId = crypto.randomUUID();
    const toolCallIds: Record<number, string> = {};
    let messageStarted = false;

    for await (const line of sseLineIterator(response)) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;

      try {
        const json = JSON.parse(data) as ChatCompletionChunk;
        const streamError = (json as unknown as { error?: { message?: string; code?: string } }).error;
        if (streamError) {
          yield { type: EventType.RUN_ERROR, message: streamError.message || "The reply stream failed.", code: streamError.code };
          return;
        }
        const choice = json.choices?.[0];
        const delta = choice?.delta ?? {};

        if (!choice) continue;

        // Emit TEXT_MESSAGE_START on first meaningful delta
        if (!messageStarted && (delta.content || delta.role)) {
          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId,
            role: "assistant",
          };
          messageStarted = true;
        }

        if (delta.content) {
          yield {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId,
            delta: delta.content,
          };
        }

        if (delta.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index;

            if (toolCall.id) {
              toolCallIds[index] = toolCall.id;
              yield {
                type: EventType.TOOL_CALL_START,
                toolCallId: toolCall.id,
                toolCallName: toolCall.function?.name || "",
              };
            }

            if (toolCall.function?.arguments) {
              const toolCallId = toolCallIds[index];
              if (toolCallId) {
                yield {
                  type: EventType.TOOL_CALL_ARGS,
                  toolCallId,
                  delta: toolCall.function.arguments,
                };
              }
            }
          }
        }

        // Emit end events based on finish_reason
        if (choice?.finish_reason === "stop") {
          yield {
            type: EventType.TEXT_MESSAGE_END,
            messageId,
          };
        } else if (choice?.finish_reason === "length") {
          if (messageStarted) yield { type: EventType.TEXT_MESSAGE_END, messageId };
          yield { type: EventType.RUN_ERROR, code: "reply_truncated", message: "The reply reached its output limit. The partial reply is preserved. Ask for a shorter answer or ask the model to continue from where it stopped." };
          return;
        } else if (choice?.finish_reason === "tool_calls") {
          for (const toolCallId of Object.values(toolCallIds)) {
            yield {
              type: EventType.TOOL_CALL_END,
              toolCallId,
            };
          }
        }
      } catch {
        console.error("Failed to parse OpenAI SSE event");
      }
    }
  },
});
