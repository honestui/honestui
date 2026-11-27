import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const upstream = vi.fn<typeof fetch>();
let client = 0;

// Each test gets a fresh module, so the cache and the queue start empty.
async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/playground/geocode/route");
}

function lookup(POST: (request: Request) => Promise<Response>, query: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://ai.example.com/api/playground/geocode", {
      method: "POST",
      headers: { host: "ai.example.com", "x-forwarded-for": `198.51.100.${++client}`, ...headers },
      body: JSON.stringify({ query }),
    }),
  );
}

const moab = [{ lat: "38.5733", lon: "-109.5498", display_name: "Moab, Grand County, Utah, United States" }];

beforeEach(() => {
  vi.stubGlobal("fetch", upstream);
  upstream.mockImplementation(async () => Response.json(moab));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  upstream.mockReset();
});

describe("playground geocode route", () => {
  it("returns the first match and identifies the site to Nominatim", async () => {
    const { POST } = await loadRoute();
    const response = await lookup(POST, "  Moab,   Utah ");
    expect(await response.json()).toEqual({
      place: { lat: 38.5733, lon: -109.5498, label: "Moab, Grand County, Utah, United States" },
    });
    const [url, init] = upstream.mock.calls[0];
    expect(String(url)).toContain("q=Moab%2C+Utah");
    expect(String(url)).toContain("limit=1");
    expect(new Headers(init!.headers).get("User-Agent")).toMatch(/^HonestAI-Playground\/.+ai\.honestui\.com/);
  });

  it("answers a repeated query from the cache, so Nominatim sees it once", async () => {
    const { POST } = await loadRoute();
    await lookup(POST, "Moab, Utah");
    const again = await lookup(POST, "moab, utah");
    expect((await again.json()).place.lat).toBe(38.5733);
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("spaces lookups a second apart and turns away a queue that is too long", async () => {
    vi.useFakeTimers();
    const { POST } = await loadRoute();
    const pending = ["A", "B", "C"].map((name) => lookup(POST, `${name} town`));
    await vi.advanceTimersByTimeAsync(0);
    expect(upstream).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(upstream).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(upstream).toHaveBeenCalledTimes(3);
    await Promise.all(pending);

    // Nine more at once would wait past the limit, so the last are refused.
    const burst = Array.from({ length: 12 }, (_, i) => lookup(POST, `Place ${i}`));
    await vi.advanceTimersByTimeAsync(20_000);
    const statuses = (await Promise.all(burst)).map((response) => response.status);
    expect(statuses.filter((status) => status === 503).length).toBeGreaterThan(0);
    expect(statuses.filter((status) => status === 200).length).toBeLessThanOrEqual(9);
  });

  it("retries a long query once without its second part, which Nominatim cannot match", async () => {
    const { POST } = await loadRoute();
    upstream.mockResolvedValueOnce(Response.json([])).mockResolvedValueOnce(Response.json(moab));
    const response = await lookup(POST, "Thompson Library, Ohio State University, Columbus, Ohio, USA");
    expect((await response.json()).place.lat).toBe(38.5733);
    const searched = upstream.mock.calls.map(([url]) => new URL(String(url)).searchParams.get("q"));
    expect(searched).toEqual([
      "Thompson Library, Ohio State University, Columbus, Ohio, USA",
      "Thompson Library, Columbus, Ohio, USA",
    ]);
  });

  it("does not retry a short query, so a miss costs one search", async () => {
    const { POST } = await loadRoute();
    upstream.mockResolvedValueOnce(Response.json([]));
    expect(await (await lookup(POST, "Nowhere, Utah, USA")).json()).toEqual({ place: null });
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("can be switched off without a code change", async () => {
    vi.stubEnv("PLAYGROUND_GEOCODER", "off");
    const { POST } = await loadRoute();
    const response = await lookup(POST, "Moab, Utah");
    expect(response.status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each([["", 400], ["x", 400], ["a".repeat(201), 400], [42, 400]])("rejects the query %j", async (query, status) => {
    const { POST } = await loadRoute();
    expect((await lookup(POST, query)).status).toBe(status);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("refuses other sites and limits one visitor", async () => {
    const { POST } = await loadRoute();
    expect((await lookup(POST, "Moab", { origin: "https://elsewhere.example" })).status).toBe(403);
    const visitor = { "x-forwarded-for": "203.0.113.200" };
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) statuses.push((await lookup(POST, "Moab, Utah", visitor)).status);
    expect(statuses.at(-1)).toBe(429);
  });

  it("treats no match as not found and a refusal from Nominatim as busy", async () => {
    const { POST } = await loadRoute();
    upstream.mockResolvedValueOnce(Response.json([]));
    expect(await (await lookup(POST, "Nowhere at all")).json()).toEqual({ place: null });
    upstream.mockResolvedValueOnce(new Response("Too many", { status: 429 }));
    const busy = await lookup(POST, "Somewhere else");
    expect(busy.status).toBe(503);
    expect((await busy.json()).error).toContain("limiting requests");
  });
});
