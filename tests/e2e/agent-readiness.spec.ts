import { expect, test } from "@playwright/test";

const missingPath = "/agent-readiness-check-this-path-does-not-exist";

function expectNegotiatedVaryHeader(headers: Record<string, string>) {
  const vary = headers.vary
    ?.split(",")
    .map((value) => value.trim().toLowerCase());

  expect(vary).toContain("accept");
  expect(vary).toContain("accept-encoding");
}

test("serves an agent-recoverable 404 with a real missing status", async ({
  request,
}) => {
  const response = await request.get(missingPath);

  expect(response.status()).toBe(404);
  expect(response.headers()["content-type"]).toContain("text/html");

  const body = await response.text();
  expect(body).toContain("Page not found");
  expect(body).toContain('href="/docs"');
  expect(body).toContain('href="/sitemap.xml"');
  expect(body).toContain('href="/llms.txt"');
  expect(body).toContain('href="/openapi.json"');

  const markdownResponse = await request.get(missingPath, {
    headers: { accept: "text/markdown" },
  });
  expect(markdownResponse.status()).toBe(404);
  expect(markdownResponse.headers()["content-type"]).toContain("text/markdown");
  expectNegotiatedVaryHeader(markdownResponse.headers());
  expect(await markdownResponse.text()).toContain("# 404: Page not found");
});

test("renders substantial, structured homepage content in raw HTML", async ({
  request,
}) => {
  const response = await request.get("/", {
    headers: { accept: "text/html" },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/html");

  const html = await response.text();
  expect(html).toMatch(/<h1(?:\s|>)/);
  expect(html).toMatch(/<h2(?:\s|>)[\s\S]*?Honest UI component previews/);

  const visibleText = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:[a-z]+|#\d+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  expect(visibleText.length).toBeGreaterThan(500);
});

test("publishes a discoverable OpenAPI 3.1 document", async ({ request }) => {
  const response = await request.get("/openapi.json");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");

  const document = await response.json();
  expect(document).toMatchObject({
    openapi: "3.1.1",
    info: {
      title: "Honest UI Registry API",
      version: "1.0.0",
    },
    servers: [
      { url: expect.stringMatching(/^https:\/\/(?:www\.)?honestui\.com$/) },
    ],
  });
  expect(document.paths).toHaveProperty("/init");
  expect(document.paths["/r/{name}.json"]).toBeDefined();
  expect(document.paths["/.well-known/agent-skills/index.json"]).toBeDefined();
  expect(document.components.schemas.ApiError.required).toEqual([
    "error",
    "code",
    "message",
    "resolution",
  ]);
});

test("returns actionable JSON errors without breaking the legacy error field", async ({
  request,
}) => {
  const missingItem = await request.get("/r/definitely-not-a-real-item.json");
  expect(missingItem.status()).toBe(404);
  expect(missingItem.headers()["content-type"]).toContain("application/json");
  await expect(missingItem.json()).resolves.toEqual({
    error: "Registry item not found",
    code: "REGISTRY_ITEM_NOT_FOUND",
    message: "Registry item not found",
    resolution: "Use /r/registry.json to find a valid public registry item name.",
  });

  const invalidPreset = await request.get("/init?style=unknown");
  expect(invalidPreset.status()).toBe(400);
  await expect(invalidPreset.json()).resolves.toMatchObject({
    error: "Invalid preset configuration",
    code: "INVALID_PRESET_CONFIGURATION",
    message: "Invalid preset configuration",
    resolution: expect.stringContaining("/openapi.json"),
  });

  const invalidSubset = await request.get("/init?only=unknown");
  expect(invalidSubset.status()).toBe(400);
  await expect(invalidSubset.json()).resolves.toMatchObject({
    code: "INVALID_ONLY_VALUE",
    resolution: expect.stringContaining("theme"),
  });
});

test("negotiates Markdown by quality and varies cache entries by Accept", async ({
  request,
}) => {
  const markdownHome = await request.get("/", {
    headers: { accept: "text/markdown, text/html;q=0.8" },
  });
  expect(markdownHome.status()).toBe(200);
  expect(markdownHome.headers()["content-type"]).toContain("text/markdown");
  expectNegotiatedVaryHeader(markdownHome.headers());
  expect(await markdownHome.text()).toContain("# Honest UI — Source-First React Components");

  const markdownDocs = await request.get("/docs/get-started", {
    headers: { accept: "text/markdown" },
  });
  expect(markdownDocs.status()).toBe(200);
  expect(markdownDocs.headers()["content-type"]).toContain("text/markdown");
  expectNegotiatedVaryHeader(markdownDocs.headers());
  expect(await markdownDocs.text()).toContain("# Get Started");

  const htmlPreferred = await request.get("/", {
    headers: { accept: "text/markdown;q=0.5, text/html;q=0.9" },
  });
  expect(htmlPreferred.headers()["content-type"]).toContain("text/html");

  const unavailable = await request.get("/", {
    headers: { accept: "application/json" },
  });
  expect(unavailable.status()).toBe(406);
  expectNegotiatedVaryHeader(unavailable.headers());
});

test("returns a Markdown 404 for a missing negotiated documentation page", async ({
  request,
}) => {
  const response = await request.get("/docs/this-page-does-not-exist", {
    headers: { accept: "text/markdown" },
  });

  expect(response.status()).toBe(404);
  expect(response.headers()["content-type"]).toContain("text/markdown");
  expectNegotiatedVaryHeader(response.headers());

  const markdown = await response.text();
  expect(markdown).toContain("# 404: Documentation page not found");
  expect(markdown).toContain("/llms.txt");
  expect(markdown).toContain("/sitemap.xml");
});
