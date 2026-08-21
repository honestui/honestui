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
  expect(html).toMatch(/<h1(?:\s|>)[\s\S]*?Honest UI:/);
  expect(html).toMatch(/<h2(?:\s|>)[\s\S]*?Honest UI component previews/);
  expect(html).toMatch(/<h2(?:\s|>)[\s\S]*?Own the interface you ship/);
  expect(html).toMatch(/<h3(?:\s|>)[\s\S]*?Sign up/);
  expect(html.match(/<h3(?:\s|>)/g)?.length).toBeGreaterThanOrEqual(8);

  const visibleText = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:[a-z]+|#\d+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  expect(visibleText.length).toBeGreaterThan(500);
  expect(visibleText.length / html.length).toBeGreaterThanOrEqual(0.05);
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
      version: "1.1.0",
    },
    servers: [
      { url: expect.stringMatching(/^https:\/\/(?:www\.)?honestui\.com$/) },
    ],
  });
  expect(document.paths).toHaveProperty("/init");
  expect(document.paths).toHaveProperty("/api/v1");
  expect(document.paths).toHaveProperty("/api/v1/init");
  expect(document.paths).toHaveProperty("/api/v1/registry");
  expect(document.paths).toHaveProperty("/api/v1/registry/{name}");
  expect(document.paths["/r/{name}.json"]).toBeDefined();
  expect(document.paths["/.well-known/agent-skills/index.json"]).toBeDefined();
  expect(document.components.schemas.ApiError.required).toEqual([
    "error",
    "code",
    "message",
    "resolution",
  ]);
  expect(document.components.schemas.ApiProblem.required).toEqual([
    "type",
    "title",
    "status",
    "detail",
    "instance",
    "code",
    "message",
    "resolution",
  ]);
  expect(document.info["x-api-versioning"]).toMatchObject({
    strategy: "URL path",
    currentMajorVersion: "v1",
    policy: expect.stringContaining("/docs/developers#deprecation-policy"),
  });
  expect(document["x-mcp-server"]).toMatchObject({
    url: expect.stringContaining("/mcp"),
    transport: "streamable-http",
    protocolVersion: "2026-07-28",
    authentication: "none",
    tools: ["list_registry_items", "get_registry_item"],
  });

  const pathItems = Object.values(document.paths) as Array<
    Record<string, unknown>
  >;
  const operations = pathItems.flatMap(
    (pathItem) =>
      ["get", "post", "put", "patch", "delete"].flatMap((method) =>
        pathItem[method] ? [pathItem[method]] : [],
      ),
  ) as Array<{
    operationId: string;
    responses: Record<string, { content?: Record<string, { schema?: Record<string, unknown> }> }>;
  }>;

  expect(operations).toHaveLength(13);
  for (const operation of operations) {
    expect(
      Object.keys(operation.responses).some((status) => /^4\d\d$/.test(status)),
      `${operation.operationId} must document a client-error response`,
    ).toBe(true);
    const successContent = operation.responses["200"]?.content;
    const successSchema = successContent
      ? Object.values(successContent)[0]?.schema
      : undefined;
    expect(successSchema, operation.operationId).toBeDefined();
    expect(
      Boolean(
        successSchema?.$ref ||
          successSchema?.properties ||
          (successSchema?.type === "array" && successSchema.items),
      ),
      `${operation.operationId} must publish a typed success schema`,
    ).toBe(true);
  }
});

test("publishes an explicit, versioned API entry point", async ({ request }) => {
  const response = await request.get("/api/v1");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(response.headers()["x-api-version"]).toBe("1");
  expect(response.headers().link).toContain('rel="deprecation"');
  expect(response.headers().link).toContain(
    "/docs/developers#deprecation-policy",
  );
  expect(response.headers().deprecation).toBeUndefined();
  expect(response.headers().sunset).toBeUndefined();

  await expect(response.json()).resolves.toMatchObject({
    name: "Honest UI Registry API",
    version: "v1",
    authentication: "none",
    documentation: expect.stringContaining("/developers"),
    openapi: expect.stringContaining("/openapi.json"),
    mcp: expect.stringContaining("/mcp"),
  });

  const options = await request.fetch("/api/v1", { method: "OPTIONS" });
  expect(options.status()).toBe(204);
  expect(options.headers().allow).toBe("GET, HEAD, OPTIONS");
  expect(options.headers()["x-api-version"]).toBe("1");
  expect(options.headers().link).toContain('rel="deprecation"');
});

test("returns RFC 9457 problem details from versioned API failures", async ({
  request,
}) => {
  const missingItem = await request.get(
    "/api/v1/registry/definitely-not-a-real-item",
  );

  expect(missingItem.status()).toBe(404);
  expect(missingItem.headers()["content-type"]).toContain(
    "application/problem+json",
  );
  expect(missingItem.headers()["x-api-version"]).toBe("1");
  await expect(missingItem.json()).resolves.toMatchObject({
    type: expect.stringContaining(
      "/docs/developers#registry-item-not-found",
    ),
    title: "Registry item not found",
    status: 404,
    detail: expect.stringContaining("definitely-not-a-real-item"),
    instance: expect.stringContaining(
      "/api/v1/registry/definitely-not-a-real-item",
    ),
    code: "REGISTRY_ITEM_NOT_FOUND",
    message: "Registry item not found",
    resolution: "GET /api/v1/registry to find a valid item name.",
  });

  const invalidPreset = await request.get("/api/v1/init?style=unknown");
  expect(invalidPreset.status()).toBe(400);
  await expect(invalidPreset.json()).resolves.toMatchObject({
    status: 400,
    code: "INVALID_PRESET_CONFIGURATION",
    resolution: expect.stringContaining("/openapi.json"),
  });

  const unknownRoute = await request.get("/api/v1/not-a-route");
  expect(unknownRoute.status()).toBe(404);
  await expect(unknownRoute.json()).resolves.toMatchObject({
    code: "API_ROUTE_NOT_FOUND",
    resolution: expect.stringContaining("/api/v1"),
  });

  const unsupportedMethod = await request.post("/api/v1/registry");
  expect(unsupportedMethod.status()).toBe(405);
  expect(unsupportedMethod.headers().allow).toBe("GET, HEAD");
  await expect(unsupportedMethod.json()).resolves.toMatchObject({
    code: "API_METHOD_NOT_ALLOWED",
    status: 405,
  });
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

test("makes Honest UI developer resources discoverable by name", async ({
  request,
}) => {
  const guide = await request.get("/docs/developers");
  expect(guide.status()).toBe(200);
  expect(guide.headers()["content-type"]).toContain("text/html");

  const html = await guide.text();
  expect(html).toContain("Honest UI Developer Resources");
  expect(html).toContain("Honest UI REST API v1");
  expect(html).toContain("Deprecation policy");
  expect(html).toContain('href="/openapi.json"');

  const index = await request.get("/developers");
  expect(index.status()).toBe(200);
  const indexHtml = await index.text();
  expect(indexHtml).toContain("Honest UI Developer Resources");
  expect(indexHtml).toContain("Honest UI CLI");
  expect(indexHtml).toContain("Honest UI REST API v1");
  expect(indexHtml).toContain("https://www.npmjs.com/package/honestui");
  expect(indexHtml).toContain("https://www.honestui.com/mcp");

  const markdownGuide = await request.get("/docs/developers.md");
  expect(markdownGuide.status()).toBe(200);
  expect(markdownGuide.headers()["content-type"]).toContain("text/markdown");
  expect(await markdownGuide.text()).toContain(
    "# Honest UI Developer Resources",
  );

  const llms = await request.get("/llms.txt");
  const llmsBody = await llms.text();
  expect(llmsBody).toContain("## Honest UI Developer Resources");
  expect(llmsBody).toContain("## When to use Honest UI");
  expect(llmsBody).toContain("## How to use Honest UI");
  expect(llmsBody).toContain("/developers");
  expect(llmsBody).toContain("/docs/developers.md");
  expect(llmsBody).toContain("/api/v1");
  expect(llmsBody).toContain("/openapi.json");
  expect(llmsBody).toContain("/mcp");
  expect(llmsBody).toContain("list_registry_items");

  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/docs/developers");
  expect(await sitemap.text()).toContain("/developers");

  const robots = await request.get("/robots.txt");
  const robotsBody = await robots.text();
  expect(robotsBody).toContain("Allow: /api/v1");
  expect(robotsBody).toContain("Allow: /mcp");
});

test("serves typed, read-only MCP tools over Streamable HTTP", async ({
  request,
}) => {
  const meta = {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientInfo": {
      name: "Honest UI release test",
      version: "1.0.0",
    },
    "io.modelcontextprotocol/clientCapabilities": {},
  };
  const call = async (
    id: string,
    method: string,
    params: Record<string, unknown>,
    name?: string,
  ) =>
    request.post("/mcp", {
      data: {
        jsonrpc: "2.0",
        id,
        method,
        params: { ...params, _meta: meta },
      },
      headers: {
        "content-type": "application/json",
        "mcp-protocol-version": "2026-07-28",
        "mcp-method": method,
        ...(name ? { "mcp-name": name } : {}),
      },
    });

  const discovery = await call("discover", "server/discover", {});
  expect(discovery.status()).toBe(200);
  expect(discovery.headers()["content-type"]).toContain("application/json");
  expect(discovery.headers()["x-content-type-options"]).toBe("nosniff");
  await expect(discovery.json()).resolves.toMatchObject({
    jsonrpc: "2.0",
    id: "discover",
    result: {
      resultType: "complete",
      supportedVersions: ["2026-07-28"],
      capabilities: { tools: {} },
      _meta: {
        "io.modelcontextprotocol/serverInfo": {
          name: "honest-ui",
          version: "1.0.0",
        },
      },
    },
  });

  const list = await call("list", "tools/list", {});
  expect(list.status()).toBe(200);
  const listBody = await list.json();
  expect(listBody.result.tools).toHaveLength(2);
  expect(listBody.result.tools).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "list_registry_items",
        inputSchema: expect.objectContaining({ type: "object" }),
        outputSchema: expect.objectContaining({ type: "object" }),
        annotations: expect.objectContaining({ readOnlyHint: true }),
      }),
      expect.objectContaining({
        name: "get_registry_item",
        inputSchema: expect.objectContaining({
          type: "object",
          required: ["name"],
        }),
        annotations: expect.objectContaining({ readOnlyHint: true }),
      }),
    ]),
  );

  const item = await call(
    "item",
    "tools/call",
    { name: "get_registry_item", arguments: { name: "button" } },
    "get_registry_item",
  );
  expect(item.status()).toBe(200);
  const itemBody = await item.json();
  expect(itemBody.result).toMatchObject({
    resultType: "complete",
  });
  expect(itemBody.result.isError).not.toBe(true);
  expect(itemBody.result.content[0].text).toContain('\"name\":\"button\"');

  const methodError = await request.get("/mcp");
  expect(methodError.status()).toBe(405);
  expect(methodError.headers()["content-type"]).toContain("application/json");
  await expect(methodError.json()).resolves.toMatchObject({
    jsonrpc: "2.0",
    error: { code: -32600 },
  });
});

test("publishes substantial About and Contact trust pages", async ({ request }) => {
  for (const path of ["/about", "/contact"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toContain("text/html");

    const html = await response.text();
    expect(html, path).toMatch(/<h1(?:\s|>)/);
    expect(html, path).toMatch(/<h2(?:\s|>)/);
    const text = html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&(?:[a-z]+|#\d+);/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    expect(text.length, path).toBeGreaterThan(500);
  }

  const sitemap = await request.get("/sitemap.xml");
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain("/about");
  expect(sitemapBody).toContain("/contact");
});

test("publishes only verified organization contact data", async ({ page }) => {
  await page.goto("/");
  const graph = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((script) => JSON.parse(script.textContent ?? "{}"));
  const organization = graph["@graph"].find(
    (entry: Record<string, unknown>) => entry["@type"] === "Organization",
  );

  expect(organization).toMatchObject({
    name: "Honest UI",
    contactPage: expect.stringContaining("/contact"),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "technical support",
      url: expect.stringContaining("/contact"),
      availableLanguage: ["English"],
    },
  });
  expect(organization.address).toBeUndefined();
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
