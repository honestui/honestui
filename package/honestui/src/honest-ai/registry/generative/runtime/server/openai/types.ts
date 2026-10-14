// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type StoreChatCompletionHistoryOptions = {
  apiKey: string;
  conversationId: string;
  /** Chat Completions messages for the new turn. */
  messages: ChatCompletionMessageParam[];
  /** Required origin of your application API. */
  apiBaseUrl: string;
  fetch?: (
    input: string,
    init?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    },
  ) => Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
    json: () => Promise<unknown>;
  }>;
};
