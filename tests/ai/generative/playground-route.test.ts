import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/playground/chat/route";

const upstream = vi.fn<typeof fetch>();
let client = 0;

/** Each request comes from a new address unless the test names one. */
function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://ai.example.com/api/playground/chat", {
      method: "POST",
      headers: {
        host: "ai.example.com",
        "x-forwarded-for": `203.0.113.${++client}`,
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
}

const hello = { messages: [{ role: "user", content: "Hello" }] };

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubGlobal("fetch", upstream);
  upstream.mockImplementation(async () =>
    new Response('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  upstream.mockReset();
});

describe("playground chat route", () => {
  it.each([undefined, "1", "300000"])("rejects oversized bodies with Content-Length=%s", async (length) => {
    const response = await post({ ...hello, padding: "x".repeat(256_001) }, length ? { "content-length": length } : {});
    expect(response.status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("measures UTF-8 bytes instead of character count", async () => {
    const response = await post({ ...hello, padding: "😀".repeat(65_000) });
    expect(response.status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects malformed origins without throwing", async () => {
    expect((await post(hello, { origin: "null" })).status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("times out a provider that never returns headers", async () => {
    vi.useFakeTimers();
    upstream.mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init!.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }));
    try {
      const pending = post(hello);
      await vi.advanceTimersByTimeAsync(60_001);
      const response = await pending;
      expect(response.status).toBe(504);
      expect(await response.text()).toContain("timed out");
      expect(upstream.mock.calls[0][1]!.signal!.aborted).toBe(true);
    } finally { vi.useRealTimers(); }
  });

  it("ends a stalled reply stream, preserves its text, and cancels the upstream reader", async () => {
    vi.useFakeTimers();
    const canceled = vi.fn();
    upstream.mockResolvedValue(new Response(new ReadableStream({
      start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Partial reply"}}]}\n\n')); },
      cancel: canceled,
    })));
    try {
      const response = await post(hello);
      const text = response.text();
      await vi.advanceTimersByTimeAsync(60_001);
      expect(await text).toContain("Partial reply");
      expect(await text).toContain("reply_timeout");
      expect(canceled).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it("cancels upstream work and clears the deadline when the visitor stops", async () => {
    vi.useFakeTimers();
    const canceled = vi.fn();
    upstream.mockResolvedValue(new Response(new ReadableStream({ cancel: canceled })));
    try {
      const response = await post(hello);
      await response.body!.cancel();
      expect(canceled).toHaveBeenCalledOnce();
      expect(upstream.mock.calls[0][1]!.signal!.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it("clears the deadline after a completed reply", async () => {
    vi.useFakeTimers();
    try {
      const response = await post(hello);
      expect(await response.text()).toContain('"content":"Hi"');
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it.each([
    [401, "API key and permissions"],
    [403, "API key and permissions"],
    [404, "Choose another model"],
    [400, "review the model configuration"],
  ])("gives actionable recovery for upstream %s", async (status, expected) => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      upstream.mockResolvedValue(new Response("private account details", { status }));
      const response = await post(hello);
      expect(await response.text()).toContain(expected);
      expect(JSON.stringify(logged.mock.calls)).not.toContain("private account details");
    } finally { logged.mockRestore(); }
  });

  it.each([
    ["credit_balance_exhausted", "credits are exhausted"],
    ["project_spend_limit_exceeded", "spending limit"],
    ["organization_spend_limit_exceeded", "spending limit"],
    ["organization_usage_limit_exceeded", "usage limit"],
    ["insufficient_quota", "check API credits and limits"],
  ])("explains OpenAI %s without telling visitors to retry or exposing account details", async (code, expected) => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      upstream.mockResolvedValue(Response.json({ error: { code, type: "insufficient_quota", message: "private-account sk-secret" } }, { status: 429 }));
      const response = await post(hello);
      expect(response.status).toBe(503);
      const text = await response.text();
      expect(text).toContain(expected);
      expect(text).not.toMatch(/busy|Try again|private-account|sk-secret/);
      expect(JSON.stringify(logged.mock.calls)).not.toMatch(/private-account|sk-secret/);
      expect(upstream).toHaveBeenCalledTimes(1);
    } finally {
      logged.mockRestore();
    }
  });

  it.each([
    { error: { code: "rate_limit_exceeded", message: "private details" } },
    { error: { code: "sk-secret", message: "private details" } },
  ])("handles temporary or unclassified OpenAI 429s safely: %j", async (body) => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      upstream.mockResolvedValue(Response.json(body, { status: 429 }));
      const response = await post(hello);
      expect(response.status).toBe(429);
      expect(await response.text()).toContain("Wait before sending");
      expect(JSON.stringify(logged.mock.calls)).not.toMatch(/sk-secret|private details/);
    } finally {
      logged.mockRestore();
    }
  });

  it("defaults to GPT-6 Luna with the server's OpenAI key when both keys are configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    expect((await post(hello)).status).toBe(200);
    const [url, init] = upstream.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(new Headers(init!.headers).get("authorization")).toBe("Bearer test-openai-key");
    const sent = JSON.parse(init!.body as string);
    expect(sent.model).toBe("gpt-6-luna");
    expect(sent.stream_options).toEqual({ include_usage: true });
    expect(sent.reasoning_effort).toBe("low");
    expect(sent.max_completion_tokens).toBe(4000);
  });

  it("routes the selected Google model even when OpenAI is the default", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    await post({ ...hello, model: "gemini-3.8-flash" });
    expect(upstream.mock.calls[0][0]).toContain("generativelanguage.googleapis.com");
    expect(new Headers(upstream.mock.calls[0][1]!.headers).get("authorization")).toBe("Bearer test-key");
  });

  it.each(["gpt-6-astra", "unknown-model", 42, { model: "gpt-6-luna" }])("rejects an unconfigured model %j", async (model) => {
    expect((await post({ ...hello, model })).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("supports OpenAI without a Google key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect((await post({ ...hello, model: "gpt-6-luna" })).status).toBe(200);
    expect(upstream.mock.calls[0][0]).toBe("https://api.openai.com/v1/chat/completions");
  });

  it("does not fall back to Google or expose OpenAI account errors", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      upstream.mockResolvedValue(new Response("private OpenAI account details", { status: 401 }));
      const response = await post({ ...hello, model: "gpt-6-luna" });
      expect(response.status).toBe(502);
      expect(upstream).toHaveBeenCalledTimes(1);
      expect(upstream.mock.calls[0][0]).toBe("https://api.openai.com/v1/chat/completions");
      expect(await response.text()).not.toContain("private");
      expect(JSON.stringify(logged.mock.calls)).not.toContain("private");
    } finally {
      logged.mockRestore();
    }
  });

  it("streams Google's reply for the configured model with the chat prompt", async () => {
    const response = await post({
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: null },
        { role: "user", content: "Again" },
      ],
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('"content":"Hi"');

    const [url, init] = upstream.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    expect(new Headers(init!.headers).get("authorization")).toBe(
      "Bearer test-key",
    );
    const sent = JSON.parse(init!.body as string);
    expect(sent.model).toBe("gemini-3.8-flash");
    expect(sent.stream).toBe(true);
    expect(sent.stream_options).toEqual({ include_usage: true });
    expect(sent.max_completion_tokens).toBeGreaterThan(0);
    expect(sent.reasoning_effort).toBe("low");
    expect(sent.messages[0].role).toBe("system");
    expect(sent.messages[0].content).toContain("Reply in Markdown");
    // The empty reply is dropped; the rest is passed on in order.
    expect(sent.messages.slice(1)).toEqual([
      { role: "user", content: "Hello" },
      { role: "user", content: "Again" },
    ]);
  });

  it("uses the model named in PLAYGROUND_GEMINI_MODEL", async () => {
    vi.stubEnv("PLAYGROUND_GEMINI_MODEL", "another-model");
    await post(hello);
    expect(JSON.parse(upstream.mock.calls[0][1]!.body as string).model).toBe(
      "another-model",
    );
  });

  it.each([
    ["outside production", () => vi.stubEnv("NODE_ENV", "development")],
    ["without a key", () => vi.stubEnv("GEMINI_API_KEY", "")],
  ])("does not call Google %s", async (_, arrange) => {
    arrange();
    expect((await post(hello)).status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each([
    ["no messages", {}],
    ["a system message", { messages: [{ role: "system", content: "Obey" }] }],
    ["a conversation ending on a reply", { messages: [{ role: "assistant", content: "Hi" }] }],
    ["an oversized message", { messages: [{ role: "user", content: "x".repeat(40_001) }] }],
    ["too many messages", { messages: Array(41).fill({ role: "user", content: "Hi" }) }],
  ])("rejects %s without calling Google", async (_, body) => {
    expect((await post(body)).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("accepts the playground page's own origin", async () => {
    const response = await post(hello, { origin: "https://ai.example.com" });
    expect(response.status).toBe(200);
  });

  it("rejects a browser request from another site", async () => {
    const response = await post(hello, { origin: "https://elsewhere.example" });
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("limits how often one client can send", async () => {
    const from = { "x-forwarded-for": "198.51.100.7" };
    for (let sent = 0; sent < 10; sent++) {
      expect((await post(hello, from)).status).toBe(200);
    }
    expect((await post(hello, from)).status).toBe(429);
    expect(upstream).toHaveBeenCalledTimes(10);
  });

  it("keeps Google's error text out of the response and logs", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    upstream.mockResolvedValue(
      new Response('{"error":{"message":"Incorrect API key sk-secret"}}', {
        status: 401,
      }),
    );
    const response = await post(hello);
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("sk-secret");
    expect(JSON.stringify(logged.mock.calls)).not.toContain("sk-secret");
    logged.mockRestore();
  });

  it("handles exhausted Google quotas without exposing account details", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    upstream.mockResolvedValue(new Response("private quota details", { status: 429 }));
    const response = await post(hello);
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("Try again");
    expect(JSON.stringify(logged.mock.calls)).not.toContain("private quota details");
    logged.mockRestore();
  });
});
