import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { describe, expect, it, vi } from "vitest";
import spec from "@/registry/honest-ai/generative/spec.json";
import { createAutofix } from "@/registry/honest-ai/generative/runtime/server/openai";
import { createHonestAIStorage } from "@/registry/honest-ai/generative/runtime/headless/storage/honestAIStorage";
import { createFrontendTokenManager, createSessionFetch } from "@/registry/honest-ai/generative/runtime/headless/storage/frontendTokenManager";
import { createToolExecutor } from "@/registry/honest-ai/generative/runtime/server/tools/execute";

const valid = 'root = Stack([TextContent("Hello")])';
describe("standalone Honest AI runtime", () => {
  it("validates without a repair call", async () => {
    const repair = vi.fn();
    const result = await createAutofix({ library: spec, repair }).completions.fix({ generation: valid });
    expect(result.status).toBe("already_valid");
    expect(repair).not.toHaveBeenCalled();
  });
  it("returns local diagnostics with no configured repair", async () => {
    const result = await createAutofix({ library: spec }).completions.fix({ generation: 'root = Unknown()' });
    expect(result.status).toBe("fix_failed");
    expect(result.unfixedErrors.length).toBeGreaterThan(0);
  });
  it("revalidates candidates and caps retries", async () => {
    const repair = vi.fn(async () => 'root = Unknown()');
    const result = await createAutofix({ library: spec, repair }).completions.fix({ generation: 'root = Unknown()' });
    expect(result.status).toBe("fix_failed");
    expect(repair).toHaveBeenCalledTimes(2);
    expect(repair.mock.calls[0]?.length).toBe(1);
  });
  it("accepts only a locally valid repair", async () => {
    const repair = vi.fn(async () => valid);
    const result = await createAutofix({ library: spec, repair }).completions.fix({ generation: 'root = Unknown()' });
    expect(result.status).toBe("fixed");
    expect(result.content).toBe(valid);
  });
  it("rejects cancelled work before invoking repair", async () => {
    const repair = vi.fn();
    const controller = new AbortController(); controller.abort();
    await expect(createAutofix({ library: spec, repair }).completions.fix({ generation: 'root = Unknown()', signal: controller.signal })).rejects.toThrow();
    expect(repair).not.toHaveBeenCalled();
  });
  it("requires an application storage URL", () => {
    expect(() => createHonestAIStorage({ apiBaseUrl: "", token: async () => "session" })).toThrow("application API URL");
  });
  it("refreshes a session once on 401 using the Honest AI header", async () => {
    const tokens = { getToken: vi.fn().mockResolvedValueOnce("stale").mockResolvedValueOnce("fresh"), invalidate: vi.fn() };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 401 })).mockResolvedValueOnce(new Response(null, { status: 200 }));
    await createSessionFetch(tokens, fetcher)("https://app.example/v1/conversations");
    expect(new Headers(fetcher.mock.calls[1]?.[1]?.headers).get("x-honestai-session-token")).toBe("fresh");
    expect(tokens.invalidate).toHaveBeenCalledWith("stale");
  });
  it("rejects malformed token responses", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ token: "", expires_at: 1 })));
    await expect(createFrontendTokenManager({ mintUrl: "/api/token", fetch: fetcher }).getToken()).rejects.toThrow("future expires_at");
  });
  it("runs registered tools locally and requires a sandbox for scripts", async () => {
    const executor = createToolExecutor({ tools: { sum: { parameters: {}, execute: async () => 3 } } });
    expect(await executor.execute({ name: "sum" })).toBe(3);
    await expect(executor.execute({ name: "script", response: "generated program" })).rejects.toThrow("sandbox");
  });
  it("emits repaired Honest AI output before stream completion", async () => {
    const chunk = (content: string | null, finish: "stop" | null): ChatCompletionChunk => ({
      id: "test", object: "chat.completion.chunk", created: 1, model: "test",
      choices: [{ index: 0, delta: content === null ? {} : { content }, finish_reason: finish }],
    });
    async function* source() {
      yield chunk('```honestai\nroot = Unknown()\n```', null);
      yield chunk(null, "stop");
    }
    const stream = createAutofix({ library: spec, repair: async () => valid }).completions.stream({ stream: source() });
    const chunks: ChatCompletionChunk[] = [];
    for await (const event of stream.chunks) chunks.push(event);
    expect((await stream.result)?.status).toBe("fixed");
    const output = chunks.map(event => event.choices[0]?.delta.content ?? "").join("");
    expect(output).toContain(valid + "\n```");
    expect(chunks.at(-1)?.choices[0]?.finish_reason).toBe("stop");
  });
  it("cancels a pending repair even if its callback ignores the signal", async () => {
    const controller = new AbortController();
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    const pipeline = createAutofix({ library: spec, repair: () => { started(); return new Promise<string>(() => {}); } });
    const pending = pipeline.completions.fix({ generation: "root = Unknown()", signal: controller.signal });
    await ready;
    controller.abort(new Error("cancelled"));
    await expect(pending).rejects.toThrow("cancelled");
  });

});
