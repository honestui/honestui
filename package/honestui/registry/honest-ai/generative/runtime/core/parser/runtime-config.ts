// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import type { ConfigPromptOptions, LibrarySpec, SystemPromptOptions } from "./prompt";
import { validateChatLibrary } from "./validate-library";

/** `]]>honestai:config\n` — request-direction config block header. Trailing newline is part of the wire contract. */
const CONFIG_MARKER = "]]>honestai:config\n";

type RuntimeConfig = { chatLibrary: Omit<LibrarySpec, "components">; systemPromptOptions?: ConfigPromptOptions };

function pickConfigPromptOptions(
  options: SystemPromptOptions | ConfigPromptOptions | undefined,
): ConfigPromptOptions | undefined {
  if (!options) return undefined;
  const picked: ConfigPromptOptions = {};
  if (options.examples) picked.examples = options.examples;
  if (options.preamble) picked.preamble = options.preamble;
  if (options.additionalRules) picked.additionalRules = options.additionalRules;
  return Object.keys(picked).length > 0 ? picked : undefined;
}

export function generateRuntimeConfig(spec: {
  library: LibrarySpec;
  promptOptions?: SystemPromptOptions | ConfigPromptOptions;
  instructions?: string;
}): string {
  let config: RuntimeConfig;

  if (spec.library) {
    const issues = validateChatLibrary(spec.library);
    if (issues.length > 0) {
      throw new Error(
        `[generateSystemPrompt] Invalid library: ${issues.map((i) => i.message).join(" ")}`,
      );
    }
    const { components: _components, ...chatLibrary } = spec.library;
    const promptOptions = pickConfigPromptOptions(spec.promptOptions);
    config = {
      chatLibrary,
      ...(promptOptions ? { systemPromptOptions: promptOptions } : {}),
    };
  } else {
    throw new Error("A local library is required for Honest AI configuration");
  }

  const block = `${CONFIG_MARKER}${JSON.stringify(config)}`;
  return spec.instructions ? `${block}\n${spec.instructions}` : block;
}
