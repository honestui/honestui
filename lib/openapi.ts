import { SITE_URL } from "@/lib/utils";

const jsonResponse = (schema: Record<string, unknown>) => ({
  description: "Successful response.",
  content: {
    "application/json": { schema },
  },
});

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ApiError" },
    },
  },
});

const methodNotAllowedResponse = {
  description: "The HTTP method is not supported.",
};

const registryCatalogSchema = { $ref: "#/components/schemas/RegistryCatalog" };
const registryItemSchema = { $ref: "#/components/schemas/RegistryItem" };
const registryBaseColorSchema = { $ref: "#/components/schemas/RegistryBaseColor" };

const initializationParameters = [
  {
    name: "base",
    in: "query",
    description: "Registry preset family. Only the base preset is published.",
    schema: { type: "string", const: "base", default: "base" },
  },
  {
    name: "style",
    in: "query",
    description: "Visual style applied to the generated registry base.",
    schema: {
      type: "string",
      enum: ["default", "crisp", "mono", "editorial"],
      default: "default",
    },
  },
  ...["baseColor", "theme"].map((name) => ({
    name,
    in: "query",
    description:
      name === "baseColor"
        ? "Semantic base color scale for the generated theme."
        : "Named palette layered on top of the base color scale.",
    schema: {
      type: "string",
      enum: ["neutral", "zinc", "stone", "mauve", "olive", "mist", "taupe"],
      default: "neutral",
    },
  })),
  {
    name: "font",
    in: "query",
    description: "Body font family loaded by the generated preset.",
    schema: {
      type: "string",
      enum: [
        "geist",
        "inter",
        "jetbrains-mono",
        "noto-sans",
        "playfair-display",
      ],
      default: "geist",
    },
  },
  {
    name: "fontHeading",
    in: "query",
    description:
      "Heading font family. The value inherit keeps the body font for headings.",
    schema: {
      type: "string",
      enum: [
        "inherit",
        "geist",
        "inter",
        "jetbrains-mono",
        "noto-sans",
        "playfair-display",
      ],
      default: "inherit",
    },
  },
  {
    name: "rtl",
    in: "query",
    description: "Emit right-to-left logical property support.",
    schema: { type: "boolean", default: false },
  },
  {
    name: "pointer",
    in: "query",
    description: "Emit coarse-pointer (touch) adjustments.",
    schema: { type: "boolean", default: false },
  },
  {
    name: "menuAccent",
    in: "query",
    description: "Menu component accent treatment.",
    schema: {
      type: "string",
      enum: ["subtle", "bold"],
      default: "subtle",
    },
  },
  {
    name: "menuColor",
    in: "query",
    description: "Menu component background treatment.",
    schema: {
      type: "string",
      enum: [
        "default",
        "inverted",
        "default-translucent",
        "inverted-translucent",
      ],
      default: "default",
    },
  },
  {
    name: "radius",
    in: "query",
    description: "Corner radius scale for the generated tokens.",
    schema: {
      type: "string",
      enum: ["default", "none", "small", "medium", "large"],
      default: "default",
    },
  },
  {
    name: "only",
    in: "query",
    description:
      "Comma-separated subset of the preset to emit: theme, font, or fonts. Omit to emit the full registry base.",
    schema: { type: "string" },
  },
];

const versionedResponseHeaders = {
  "X-Api-Version": { $ref: "#/components/headers/ApiVersion" },
  Link: { $ref: "#/components/headers/DeprecationPolicyLink" },
  "RateLimit-Limit": { $ref: "#/components/headers/RateLimitLimit" },
  "RateLimit-Remaining": { $ref: "#/components/headers/RateLimitRemaining" },
  "RateLimit-Reset": { $ref: "#/components/headers/RateLimitReset" },
  "RateLimit-Policy": { $ref: "#/components/headers/RateLimitPolicy" },
};

const versionedJsonResponse = (schema: Record<string, unknown>) => ({
  ...jsonResponse(schema),
  headers: versionedResponseHeaders,
});

const problemResponse = (description: string) => ({
  description,
  headers: versionedResponseHeaders,
  content: {
    "application/problem+json": {
      schema: { $ref: "#/components/schemas/ApiProblem" },
    },
  },
});

const rateLimitedResponse = () => ({
  description:
    "The client exceeded the documented fair-use window. Honor Retry-After before retrying.",
  headers: {
    ...versionedResponseHeaders,
    "Retry-After": { $ref: "#/components/headers/RetryAfter" },
  },
  content: {
    "application/problem+json": {
      schema: { $ref: "#/components/schemas/ApiProblem" },
    },
  },
});

const registryNameParameter = {
  name: "name",
  in: "path",
  required: true,
  description:
    "Exact public registry item name, lowercase letters, digits, and hyphens. List valid names from the registry catalog first.",
  schema: { type: "string", pattern: "^[a-z0-9-]+$" },
};

export function getOpenApiDocument() {
  return {
    openapi: "3.1.1",
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    info: {
      title: "Honest UI Registry API",
      version: "1.3.0",
      description:
        "Versioned, public, read-only endpoints for discovering Honest UI registry items and generating shadcn-compatible initialization presets. No account or credential is required. New integrations should use /api/v1; the unversioned /r and /init paths remain compatibility aliases.",
      license: {
        name: "MIT",
        identifier: "MIT",
      },
      "x-api-versioning": {
        strategy: "URL path",
        currentMajorVersion: "v1",
        policy: `${SITE_URL}/docs/developers#deprecation-policy`,
      },
    },
    externalDocs: {
      description: "Developer Resources and API lifecycle policy",
      url: `${SITE_URL}/developers`,
    },
    servers: [{ url: SITE_URL }],
    security: [],
    "x-mcp-server": {
      url: `${SITE_URL}/mcp`,
      transport: "streamable-http",
      protocolVersion: "2026-07-28",
      authentication: "none",
      tools: ["list_registry_items", "get_registry_item"],
      serverCard: `${SITE_URL}/mcp/server-card`,
      aiCatalog: `${SITE_URL}/.well-known/ai-catalog.json`,
    },
    tags: [
      {
        name: "Registry",
        description: "Discover and retrieve shadcn-compatible registry documents.",
      },
      {
        name: "Initialization",
        description: "Generate a registry base from explicit design-system options.",
      },
      {
        name: "Agent discovery",
        description: "Discover machine-readable Honest UI resources.",
      },
      {
        name: "API discovery",
        description: "Discover the current Honest UI REST API contract.",
      },
    ],
    paths: {
      "/api/v1": {
        get: {
          operationId: "getApiIndexV1",
          summary: "Discover Honest UI API v1",
          description:
            "Returns the current version, authentication requirement, documentation, OpenAPI specification, and primary resource links.",
          tags: ["API discovery"],
          responses: {
            "200": versionedJsonResponse({
              $ref: "#/components/schemas/ApiIndex",
            }),
            "405": problemResponse("The HTTP method is not supported."),
            "429": rateLimitedResponse(),
          },
        },
      },
      "/api/v1/init": {
        get: {
          operationId: "generateInitializationPresetV1",
          summary: "Generate an initialization preset",
          tags: ["Initialization"],
          description:
            "Generates a shadcn-compatible registry base from explicit design-system options. Invalid query values produce a 400 problem response.",
          parameters: initializationParameters,
          responses: {
            "200": versionedJsonResponse(registryItemSchema),
            "400": problemResponse("The preset configuration is invalid."),
            "405": problemResponse("The HTTP method is not supported."),
            "429": rateLimitedResponse(),
          },
        },
      },
      "/api/v1/registry": {
        get: {
          operationId: "getRegistryCatalogV1",
          summary: "Get the public registry catalog",
          tags: ["Registry"],
          description:
            "Returns the full public registry catalog, including every item name and type. Use it to discover valid names for other endpoints.",
          responses: {
            "200": versionedJsonResponse(registryCatalogSchema),
            "405": problemResponse("The HTTP method is not supported."),
            "429": rateLimitedResponse(),
          },
        },
      },
      "/api/v1/registry/index": {
        get: {
          operationId: "listRegistryItemsV1",
          summary: "List every registry item",
          tags: ["Registry"],
          description:
            "Returns a compact array of registry item names and types for clients that only need valid names.",
          responses: {
            "200": versionedJsonResponse({
              type: "array",
              items: { $ref: "#/components/schemas/RegistryIndexItem" },
            }),
            "405": problemResponse("The HTTP method is not supported."),
            "429": rateLimitedResponse(),
          },
        },
      },
      "/api/v1/registry/{name}": {
        get: {
          operationId: "getRegistryItemV1",
          summary: "Get a registry item",
          tags: ["Registry"],
          description:
            "Returns one registry item with its source files, dependencies, and CSS variables. Use an exact name returned by listRegistryItemsV1.",
          parameters: [registryNameParameter],
          responses: {
            "200": versionedJsonResponse(registryItemSchema),
            "404": problemResponse("No registry item has the requested name."),
            "405": problemResponse("The HTTP method is not supported."),
            "429": rateLimitedResponse(),
          },
        },
      },
      "/api/v1/colors/{name}": {
        get: {
          operationId: "getRegistryBaseColorV1",
          summary: "Get the registry base-color definition",
          tags: ["Registry"],
          description:
            "Returns the CSS variable definitions for one base color scale in light and dark variants.",
          parameters: [registryNameParameter],
          responses: {
            "200": versionedJsonResponse(registryBaseColorSchema),
            "405": problemResponse("The HTTP method is not supported."),
            "429": rateLimitedResponse(),
          },
        },
      },
      "/init": {
        get: {
          operationId: "generateInitializationPreset",
          summary: "Generate an initialization preset",
          tags: ["Initialization"],
          description:
            "Compatibility alias of generateInitializationPresetV1 on the unversioned path used by existing CLI consumers.",
          parameters: initializationParameters,
          responses: {
            "200": jsonResponse(registryItemSchema),
            "400": errorResponse("The preset configuration is invalid."),
          },
        },
      },
      "/r/index.json": {
        get: {
          operationId: "listRegistryItems",
          summary: "List every registry item",
          tags: ["Registry"],
          description:
            "Compatibility alias of listRegistryItemsV1 on the unversioned /r path used by existing CLI consumers.",
          responses: {
            "200": jsonResponse({
              type: "array",
              items: { $ref: "#/components/schemas/RegistryIndexItem" },
            }),
            "405": methodNotAllowedResponse,
          },
        },
      },
      "/r/registry.json": {
        get: {
          operationId: "getRegistryCatalog",
          summary: "Get the public registry catalog",
          tags: ["Registry"],
          description:
            "Compatibility alias of getRegistryCatalogV1 on the unversioned /r path used by existing CLI consumers.",
          responses: {
            "200": jsonResponse(registryCatalogSchema),
            "405": methodNotAllowedResponse,
          },
        },
      },
      "/r/{name}.json": {
        get: {
          operationId: "getRegistryItem",
          summary: "Get a registry item",
          tags: ["Registry"],
          description:
            "Compatibility alias of getRegistryItemV1 on the unversioned /r path used by existing CLI consumers. Returns 404 when the name does not exist.",
          parameters: [
            {
              name: "name",
              in: "path",
              required: true,
              description:
                "Exact public registry item name, lowercase letters, digits, and hyphens.",
              schema: { type: "string", pattern: "^[a-z0-9-]+$" },
            },
          ],
          responses: {
            "200": jsonResponse(registryItemSchema),
            "404": errorResponse("No registry item has the requested name."),
          },
        },
      },
      "/r/colors/{name}.json": {
        get: {
          operationId: "getRegistryBaseColor",
          summary: "Get the registry base-color definition",
          tags: ["Registry"],
          description:
            "Compatibility alias of getRegistryBaseColorV1 on the unversioned /r path used by existing CLI consumers.",
          parameters: [
            {
              name: "name",
              in: "path",
              required: true,
              description:
                "Exact public registry item name, lowercase letters, digits, and hyphens.",
              schema: { type: "string", pattern: "^[a-z0-9-]+$" },
            },
          ],
          responses: {
            "200": jsonResponse(registryBaseColorSchema),
            "405": methodNotAllowedResponse,
          },
        },
      },
      "/.well-known/agent-skills/index.json": {
        get: {
          operationId: "getAgentSkillsIndex",
          summary: "Get the agent skills discovery index",
          tags: ["Agent discovery"],
          description:
            "Returns the Agent Skills discovery index describing the Honest UI skill document and its location.",
          responses: {
            "200": jsonResponse({
              $ref: "#/components/schemas/AgentSkillsIndex",
            }),
            "405": methodNotAllowedResponse,
          },
        },
      },
      "/mcp/server-card": {
        get: {
          operationId: "getMcpServerCard",
          summary: "Get the MCP Server Card",
          tags: ["Agent discovery"],
          description:
            "Returns the MCP Server Card (SEP-2127) describing the Honest UI Streamable HTTP MCP endpoint and its supported protocol versions.",
          responses: {
            "200": {
              description: "The Server Card document.",
              content: {
                "application/mcp-server-card+json": {
                  schema: {
                    $ref: "#/components/schemas/McpServerCard",
                  },
                },
              },
            },
            "304": {
              description:
                "The card has not changed since the ETag sent in If-None-Match.",
            },
            "405": methodNotAllowedResponse,
          },
        },
      },
      "/.well-known/ai-catalog.json": {
        get: {
          operationId: "getMcpAiCatalog",
          summary: "Get the AI Catalog of Honest UI MCP servers",
          tags: ["Agent discovery"],
          description:
            "Returns the domain-level AI Catalog that links to the Honest UI MCP Server Card for automated server discovery.",
          responses: {
            "200": {
              description: "The AI Catalog document.",
              content: {
                "application/ai-catalog+json": {
                  schema: { $ref: "#/components/schemas/AiCatalog" },
                },
              },
            },
            "405": methodNotAllowedResponse,
          },
        },
      },
      "/openapi.json": {
        get: {
          operationId: "getOpenApiDocument",
          summary: "Get this OpenAPI document",
          tags: ["Agent discovery"],
          description:
            "Returns this OpenAPI document so agents can fetch the full HTTP contract at runtime.",
          responses: {
            "200": jsonResponse({
              $ref: "#/components/schemas/OpenApiDocument",
            }),
            "405": methodNotAllowedResponse,
          },
        },
      },
    },
    components: {
      headers: {
        ApiVersion: {
          description: "The major version of the REST API response.",
          schema: { type: "string", const: "1" },
        },
      DeprecationPolicyLink: {
        description:
          "A Link header using rel=deprecation to make the API lifecycle policy discoverable. Its presence does not mean the resource is deprecated.",
        schema: {
          type: "string",
          example: `<${SITE_URL}/docs/developers#deprecation-policy>; rel="deprecation"; type="text/html"`,
        },
      },
      RateLimitLimit: {
        description:
          "Maximum number of requests the client may make in the current one-minute fair-use window.",
        schema: { type: "integer", const: 600 },
      },
      RateLimitRemaining: {
        description:
          "Requests remaining in the current window. Values are enforced per serving instance, so they can only understate the shared allowance.",
        schema: { type: "integer", minimum: 0 },
      },
      RateLimitReset: {
        description:
          "Unix timestamp in whole seconds at which the current window resets.",
        schema: { type: "integer", minimum: 0 },
      },
      RateLimitPolicy: {
        description:
          "The published fair-use policy as a fixed-window quota expression.",
        schema: { type: "string", const: "600;w=60" },
      },
      RetryAfter: {
        description:
          "Seconds the client should wait before retrying after a 429 response.",
        schema: { type: "integer", minimum: 1 },
      },
      },
      schemas: {
        ApiIndex: {
          type: "object",
          additionalProperties: false,
          required: [
            "name",
            "version",
            "description",
            "authentication",
            "authenticationDocumentation",
            "documentation",
            "openapi",
            "mcp",
            "resources",
          ],
          properties: {
            name: { type: "string", const: "Honest UI Registry API" },
            version: { type: "string", const: "v1" },
            description: { type: "string" },
            authentication: { type: "string", const: "none" },
            authenticationDocumentation: {
              type: "string",
              format: "uri",
            },
            documentation: { type: "string", format: "uri" },
            openapi: { type: "string", format: "uri" },
            mcp: { type: "string", format: "uri" },
            resources: {
              type: "object",
              additionalProperties: { type: "string", format: "uri" },
            },
          },
        },
        ApiProblem: {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "title",
            "status",
            "detail",
            "instance",
            "code",
            "message",
            "resolution",
          ],
          properties: {
            type: { type: "string", format: "uri" },
            title: { type: "string" },
            status: { type: "integer", minimum: 400, maximum: 599 },
            detail: { type: "string" },
            instance: { type: "string", format: "uri" },
            code: {
              type: "string",
              enum: [
                "API_METHOD_NOT_ALLOWED",
                "API_ROUTE_NOT_FOUND",
                "INVALID_ONLY_VALUE",
                "INVALID_PRESET_CONFIGURATION",
                "RATE_LIMIT_EXCEEDED",
                "REGISTRY_ITEM_NOT_FOUND",
              ],
            },
            message: { type: "string" },
            resolution: { type: "string" },
          },
        },
        ApiError: {
          type: "object",
          additionalProperties: false,
          required: ["error", "code", "message", "resolution"],
          properties: {
            error: {
              type: "string",
              description: "Backward-compatible copy of message.",
            },
            code: {
              type: "string",
              enum: [
                "INVALID_ONLY_VALUE",
                "INVALID_PRESET_CONFIGURATION",
                "REGISTRY_ITEM_NOT_FOUND",
              ],
            },
            message: { type: "string" },
            resolution: { type: "string" },
          },
        },
        RegistryItemType: {
          type: "string",
          enum: [
            "registry:lib",
            "registry:block",
            "registry:component",
            "registry:ui",
            "registry:hook",
            "registry:page",
            "registry:file",
            "registry:theme",
            "registry:style",
            "registry:item",
            "registry:base",
            "registry:font",
            "registry:example",
            "registry:internal",
          ],
        },
        RegistryFile: {
          type: "object",
          additionalProperties: false,
          required: ["path", "type", "content"],
          properties: {
            path: { type: "string" },
            type: { $ref: "#/components/schemas/RegistryItemType" },
            content: { type: "string" },
            target: { type: "string" },
          },
        },
        StringMap: {
          type: "object",
          additionalProperties: { type: "string" },
        },
        RegistryCssVariables: {
          type: "object",
          additionalProperties: false,
          properties: {
            theme: { $ref: "#/components/schemas/StringMap" },
            light: { $ref: "#/components/schemas/StringMap" },
            dark: { $ref: "#/components/schemas/StringMap" },
          },
        },
        RegistryItem: {
          type: "object",
          additionalProperties: true,
          required: ["name", "type"],
          properties: {
            $schema: { type: "string", format: "uri" },
            extends: { type: "string" },
            name: { type: "string", minLength: 1 },
            title: { type: "string" },
            author: { type: "string" },
            description: { type: "string" },
            type: { $ref: "#/components/schemas/RegistryItemType" },
            dependencies: {
              type: "array",
              items: { type: "string" },
              uniqueItems: true,
            },
            devDependencies: {
              type: "array",
              items: { type: "string" },
              uniqueItems: true,
            },
            registryDependencies: {
              type: "array",
              items: { type: "string", format: "uri-reference" },
              uniqueItems: true,
            },
            files: {
              type: "array",
              items: { $ref: "#/components/schemas/RegistryFile" },
            },
            cssVars: { $ref: "#/components/schemas/RegistryCssVariables" },
            envVars: { $ref: "#/components/schemas/StringMap" },
            categories: {
              type: "array",
              items: { type: "string" },
            },
            docs: { type: "string" },
            config: {
              type: "object",
              description:
                "Initialization configuration for registry:base responses.",
              additionalProperties: true,
            },
            tailwind: {
              type: "object",
              additionalProperties: true,
            },
            css: {
              type: "object",
              additionalProperties: true,
            },
            meta: {
              type: "object",
              additionalProperties: true,
            },
            font: {
              type: "object",
              additionalProperties: false,
              required: ["family", "provider", "import", "variable"],
              properties: {
                family: { type: "string" },
                provider: { type: "string", const: "google" },
                import: { type: "string" },
                variable: { type: "string" },
                weight: { type: "array", items: { type: "string" } },
                subsets: { type: "array", items: { type: "string" } },
                selector: { type: "string" },
                dependency: { type: "string" },
              },
            },
          },
        },
        RegistryCatalog: {
          type: "object",
          additionalProperties: false,
          required: ["$schema", "name", "homepage", "items"],
          properties: {
            $schema: { type: "string", format: "uri" },
            name: { type: "string", const: "honestui" },
            homepage: { type: "string", format: "uri" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/RegistryIndexItem" },
            },
          },
        },
        RegistryBaseColor: {
          type: "object",
          additionalProperties: false,
          required: ["cssVars", "cssVarsV4"],
          properties: {
            cssVars: {
              type: "object",
              additionalProperties: false,
              required: ["light", "dark"],
              properties: {
                light: { $ref: "#/components/schemas/StringMap" },
                dark: { $ref: "#/components/schemas/StringMap" },
              },
            },
            cssVarsV4: {
              type: "object",
              additionalProperties: false,
              required: ["light", "dark"],
              properties: {
                light: { $ref: "#/components/schemas/StringMap" },
                dark: { $ref: "#/components/schemas/StringMap" },
              },
            },
          },
        },
        OpenApiDocument: {
          type: "object",
          additionalProperties: true,
          required: ["openapi", "info", "servers", "paths"],
          properties: {
            openapi: { type: "string", const: "3.1.1" },
            jsonSchemaDialect: { type: "string", format: "uri" },
            info: {
              type: "object",
              required: ["title", "version"],
              properties: {
                title: { type: "string" },
                version: { type: "string" },
                description: { type: "string" },
              },
            },
            servers: {
              type: "array",
              items: {
                type: "object",
                required: ["url"],
                properties: { url: { type: "string", format: "uri" } },
              },
            },
            paths: { type: "object", additionalProperties: true },
          },
        },
        RegistryIndexItem: {
          type: "object",
          additionalProperties: false,
          required: ["name", "type"],
          properties: {
            name: { type: "string" },
            type: { type: "string" },
          },
        },
        AgentSkillsIndex: {
          type: "object",
          additionalProperties: false,
          required: ["$schema", "skills"],
          properties: {
            $schema: { type: "string", format: "uri" },
            skills: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "type", "description", "url"],
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" },
                  url: { type: "string", format: "uri-reference" },
                },
              },
            },
          },
        },
        McpServerCard: {
          type: "object",
          additionalProperties: false,
          description:
            "MCP Server Card (SEP-2127) describing a remote MCP server's identity, transport, and protocol versions. Cards deliberately exclude tools and capabilities.",
          required: ["$schema", "name", "description", "version"],
          properties: {
            $schema: {
              type: "string",
              const: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
            },
            name: {
              type: "string",
              pattern: "^[a-zA-Z0-9.-]+/[a-zA-Z0-9._-]+$",
              description:
                "Reverse-DNS catalog name with exactly one namespace separator.",
            },
            title: { type: "string" },
            description: { type: "string", maxLength: 100 },
            version: { type: "string" },
            websiteUrl: { type: "string", format: "uri" },
            repository: {
              type: "object",
              additionalProperties: false,
              required: ["source", "url"],
              properties: {
                source: { type: "string" },
                url: { type: "string", format: "uri" },
              },
            },
            remotes: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["type", "url"],
                properties: {
                  type: {
                    type: "string",
                    enum: ["sse", "streamable-http"],
                  },
                  url: { type: "string", format: "uri" },
                  supportedProtocolVersions: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        AiCatalog: {
          type: "object",
          additionalProperties: false,
          description:
            "Domain-level AI Catalog advertising MCP Server Cards published by Honest UI.",
          required: ["specVersion", "entries"],
          properties: {
            specVersion: { type: "string", const: "1.0" },
            entries: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["identifier", "type", "url"],
                properties: {
                  identifier: { type: "string" },
                  type: {
                    type: "string",
                    const: "application/mcp-server-card+json",
                  },
                  url: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
      },
    },
  };
}
