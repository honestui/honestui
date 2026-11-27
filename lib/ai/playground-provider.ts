/**
 * Where the docs playground gets its replies. A production build with an
 * hosted API key answers through this site's server. Every other build talks to
 * the visitor's own Ollama from the browser, so local work spends nothing.
 */
export type HostedPlaygroundModel = {
  model: string;
  provider: "openai" | "google";
  contextTokens?: number;
};

export type PlaygroundProvider =
  | { kind: "ollama" }
  | {
      kind: "hosted";
      model: string;
      /** The model's context window, when the deployment states it. */
      contextTokens?: number;
      models?: HostedPlaygroundModel[];
    };

const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

/** A whole number of tokens above zero, or nothing. No size is assumed for a model. */
function readContextTokens(value: string | undefined) {
  const tokens = Number(value);
  return Number.isInteger(tokens) && tokens > 0 ? tokens : undefined;
}

export function getPlaygroundProvider(): PlaygroundProvider {
  if (process.env.NODE_ENV !== "production") return { kind: "ollama" };
  const models: HostedPlaygroundModel[] = [];
  if (process.env.OPENAI_API_KEY?.trim()) {
    models.push({
      model: "gpt-6-luna",
      provider: "openai",
      contextTokens: readContextTokens(process.env.PLAYGROUND_OPENAI_CONTEXT_TOKENS),
    });
  }
  if (process.env.GEMINI_API_KEY?.trim()) {
    models.push({
      model: process.env.PLAYGROUND_GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      provider: "google",
      contextTokens: readContextTokens(process.env.PLAYGROUND_GEMINI_CONTEXT_TOKENS),
    });
  }
  const first = models[0];
  return first
    ? { kind: "hosted", model: first.model, contextTokens: first.contextTokens, models }
    : { kind: "ollama" };
}
