import { getPlaygroundProvider } from "@/lib/ai/playground-provider";
import chatSpec from "@/registry/honest-ai/generative/chat-spec.json";
import { generateSystemPrompt } from "@/registry/honest-ai/generative/runtime/core";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// The endpoint is public and spends the site's key, so every request is bounded.
const MAX_MESSAGES = 40;
const MAX_CONVERSATION_CHARACTERS = 40_000;
const MAX_REPLY_TOKENS = 4_000;
const MAX_REQUEST_BYTES = 256_000;
const REPLY_TIMEOUT_MS = 60_000;
const TIMEOUT_MESSAGE = "The reply timed out. Any text already received is preserved. Try a shorter request or send your message again.";
const REQUESTS_PER_WINDOW = 10;
const WINDOW_MILLISECONDS = 60_000;

const systemPrompt = generateSystemPrompt({ library: chatSpec });

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Request times by client address. This lives in one server instance's
 * memory, so it slows a single abusive client but is not a spending limit.
 * Configure provider-level budget controls separately.
 */
const recentRequests = new Map<string, number[]>();

function isRateLimited(client: string, now: number) {
  const recent = (recentRequests.get(client) ?? []).filter(
    (time) => now - time < WINDOW_MILLISECONDS,
  );
  if (recent.length >= REQUESTS_PER_WINDOW) {
    recentRequests.set(client, recent);
    return true;
  }
  recentRequests.set(client, [...recent, now]);
  // Forget clients whose window has passed, so the map cannot grow forever.
  if (recentRequests.size > 5_000) {
    for (const [key, times] of recentRequests) {
      if (times.every((time) => now - time >= WINDOW_MILLISECONDS))
        recentRequests.delete(key);
    }
  }
  return false;
}

/** The user and assistant text of the conversation, or null when it is not a valid one. */
function readConversation(body: unknown): ChatMessage[] | null {
  const messages = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) return null;

  const conversation: ChatMessage[] = [];
  for (const message of messages) {
    const { role, content } = (message ?? {}) as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    // A reply with no text, such as one stopped before it began, adds nothing.
    if (typeof content !== "string" || content === "") continue;
    conversation.push({ role, content });
  }

  const characters = conversation.reduce(
    (total, message) => total + message.content.length,
    0,
  );
  return conversation.at(-1)?.role === "user" &&
    characters <= MAX_CONVERSATION_CHARACTERS
    ? conversation
    : null;
}

function refuse(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Bound bytes even when Content-Length is missing or inaccurate. */
async function readBody(request: Request): Promise<unknown | Response> {
  const length = Number(request.headers.get("content-length"));
  if (length > MAX_REQUEST_BYTES) {
    void request.body?.cancel().catch(() => {});
    return refuse(413, "This request is too large. Shorten your message or start a new chat.");
  }
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_REQUEST_BYTES) {
        void reader.cancel().catch(() => {});
        return refuse(413, "This request is too large. Shorten your message or start a new chat.");
      }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const provider = getPlaygroundProvider();
  if (provider.kind !== "hosted") {
    return refuse(404, "This build answers from Ollama, not from the server.");
  }

  // A browser on another site sends its own Origin. Scripts can omit it, which
  // is why the limits below do not depend on this check.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) {
        return refuse(403, "This endpoint only serves the playground page.");
      }
    } catch {
      return refuse(403, "This endpoint only serves the playground page.");
    }
  }

  const client =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isRateLimited(client, Date.now())) {
    return refuse(429, "Too many messages. Wait a minute, then send it again.");
  }

  const body = await readBody(request);
  if (body instanceof Response) return body;
  const requestedModel = (body as { model?: unknown } | null)?.model ?? provider.model;
  const selected = provider.models?.find((item) => item.model === requestedModel);
  if (!selected) return refuse(400, "Choose an available playground model.");
  const conversation = readConversation(body);
  if (!conversation) {
    return refuse(
      400,
      "This conversation is too long for the playground. Start a new chat.",
    );
  }

  let upstream: Response;
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), REPLY_TIMEOUT_MS);
  timer.unref();
  const signal = AbortSignal.any([request.signal, deadline.signal]);
  try {
    upstream = await fetch(selected.provider === "openai" ? OPENAI_URL : GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${selected.provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model: selected.model,
        stream: true,
        // The last chunk then carries the token counts the context meter shows.
        stream_options: { include_usage: true },
        max_completion_tokens: MAX_REPLY_TOKENS,
        // Leave room for the visible reply within the bounded token budget.
        reasoning_effort: "low",
        messages: [{ role: "system", content: systemPrompt }, ...conversation],
      }),
      // Stopping the reply in the browser stops the upstream request.
      signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (request.signal.aborted) return new Response(null, { status: 499 });
    if (deadline.signal.aborted) return refuse(504, TIMEOUT_MESSAGE);
    console.error(`Playground: the request to ${selected.provider} failed`, error instanceof Error ? error.name : "Unknown error");
    return refuse(502, "The model could not be reached. Try again in a moment.");
  }

  if (!upstream.ok || !upstream.body) {
    clearTimeout(timer);
    if (selected.provider === "openai" && upstream.status === 429) {
      // Read only documented codes. Never return or log the provider's raw message.
      const details = await upstream.json().catch(() => null);
      const code = details?.error?.code;
      let message: string | undefined;
      let reason = "rate_limit_or_unknown";
      if (code === "credit_balance_exhausted") {
        reason = "credit_balance_exhausted";
        message = "The playground's OpenAI API credits are exhausted. The site owner needs to add API credits before replies can resume.";
      } else if (code === "organization_spend_limit_exceeded" || code === "project_spend_limit_exceeded") {
        reason = "spend_limit_exceeded";
        message = "The playground has reached its OpenAI API spending limit. The site owner needs to review the limit before replies can resume.";
      } else if (code === "organization_usage_limit_exceeded") {
        reason = "usage_limit_exceeded";
        message = "The playground has reached its OpenAI API usage limit. The site owner needs to review the limit before replies can resume.";
      } else if (code === "insufficient_quota" || details?.error?.type === "insufficient_quota") {
        reason = "insufficient_quota";
        message = "OpenAI cannot serve replies with the playground's current API quota. The site owner needs to check API credits and limits.";
      }
      console.error(`Playground: openai answered 429 (${reason})`);
      return message
        ? refuse(503, message)
        : refuse(429, "OpenAI is limiting requests to the playground. Wait before sending your message again.");
    }
    // Provider error bodies can contain account details; log only the status.
    void upstream.body?.cancel().catch(() => {});
    console.error(`Playground: ${selected.provider} answered ${upstream.status}`);
    if (upstream.status === 401 || upstream.status === 403) {
      return refuse(502, "The playground cannot authenticate or access this model. The site owner needs to check the API key and permissions before replies can resume.");
    }
    if (upstream.status === 404) {
      return refuse(502, "This model is unavailable to the playground. Choose another model, or ask the site owner to check model access.");
    }
    if (upstream.status === 400) {
      return refuse(502, "The provider rejected this request. The site owner needs to review the model configuration.");
    }
    return upstream.status === 429
      ? refuse(503, "The playground is busy. Try again in a moment.")
      : refuse(502, "The model returned an error. Try again in a moment.");
  }

  const reader = upstream.body.getReader();
  let closed = false;
  const cleanup = () => {
    clearTimeout(timer);
    signal.removeEventListener("abort", onAbort);
  };
  let streamController: ReadableStreamDefaultController<Uint8Array>;
  const onAbort = () => {
    if (closed) return;
    closed = true;
    cleanup();
    if (request.signal.aborted) {
      streamController.error(new DOMException("Request canceled", "AbortError"));
    } else {
      streamController.enqueue(new TextEncoder().encode(`\n\ndata: ${JSON.stringify({ error: { message: TIMEOUT_MESSAGE, code: "reply_timeout" } })}\n\n`));
      streamController.close();
    }
    void reader.cancel().finally(() => reader.releaseLock()).catch(() => {});
  };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
      signal.addEventListener("abort", onAbort, { once: true });
      if (signal.aborted) onAbort();
    },
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (closed) return;
        if (done) {
          closed = true;
          cleanup();
          reader.releaseLock();
          controller.close();
        } else controller.enqueue(value);
      } catch {
        if (closed) return;
        closed = true;
        cleanup();
        reader.releaseLock();
        controller.enqueue(new TextEncoder().encode(`\n\ndata: ${JSON.stringify({ error: { message: "The connection ended before the reply finished. Any text already received is preserved. Try again in a moment." } })}\n\n`));
        controller.close();
      }
    },
    cancel() {
      closed = true;
      cleanup();
      deadline.abort();
      return reader.cancel().finally(() => reader.releaseLock());
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
