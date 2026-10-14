import { generateSystemPrompt, type Parser } from "../../core/index";
import type { AutofixInput, AutofixOptions, AutofixResult } from "./types";
import { AutofixError, MAX_AUTOFIX_GENERATION_LENGTH } from "./types";
import { abortable } from "./abort";
import { errorsOf, repairContext, unwrapHonestAIFence } from "./utils";

/** Validate every candidate locally; applications own optional model calls. */
export async function fixGeneration(
  { library, repair, maxAttempts = 2, parser }: AutofixOptions & { parser: Parser },
  { generation, messages = [], signal }: AutofixInput,
): Promise<AutofixResult> {
  signal?.throwIfAborted();
  const checkLength = (candidate: string) => {
    if (typeof candidate !== "string") throw new AutofixError("Repair must return a string", "invalid_response");
    if (candidate.length > MAX_AUTOFIX_GENERATION_LENGTH)
      throw new AutofixError("Generation exceeds 100,000 characters", "generation_too_large");
  };
  checkLength(generation);
  const initialErrors = errorsOf(parser.parse(unwrapHonestAIFence(generation)));
  if (!initialErrors.length)
    return { status: "already_valid", original: generation, content: generation, fixedErrors: [], unfixedErrors: [] };
  let candidate = generation;
  let diagnostics = initialErrors;
  if (repair) {
    const systemPrompt = generateSystemPrompt({ library });
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      signal?.throwIfAborted();
      const pending = repair({ generation: candidate, diagnostics, systemPrompt, messages: repairContext(messages), attempt, signal });
      candidate = await (signal ? abortable(pending, signal) : pending);
      signal?.throwIfAborted();
      checkLength(candidate);
      candidate = unwrapHonestAIFence(candidate);
      diagnostics = errorsOf(parser.parse(candidate));
      if (!diagnostics.length)
        return { status: "fixed", original: generation, content: candidate, fixedErrors: initialErrors, unfixedErrors: [] };
    }
  }
  return { status: "fix_failed", original: generation, content: null, fixedErrors: [], unfixedErrors: diagnostics };
}
