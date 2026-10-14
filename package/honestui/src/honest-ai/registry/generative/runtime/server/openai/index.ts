// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import { createAutofix as createAutofixPipeline } from "../shared/create-autofix";
import type { AutofixOptions } from "../shared/types";
import { openAIAdapter } from "./adapter";

export {
  chatCompletionMessagesToItems,
  storeChatCompletionHistory,
} from "./store-conversation-items";
export type { StoreChatCompletionHistoryOptions } from "./types";

// Create validation and repair helpers for OpenAI Chat Completions and Responses.
export function createAutofix(options: AutofixOptions) {
  return {
    completions: createAutofixPipeline(options, openAIAdapter),
  };
}

export type { AutofixOptions, AutofixResult, RepairRequest } from "../shared/types";
