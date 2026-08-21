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

const registryDocumentSchema = {
  type: "object",
  additionalProperties: true,
} as const;

export function getOpenApiDocument() {
  return {
    openapi: "3.1.1",
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    info: {
      title: "Honest UI Registry API",
      version: "1.0.0",
      description:
        "Read-only endpoints for discovering Honest UI registry items and generating shadcn-compatible initialization presets.",
      license: {
        name: "MIT",
        identifier: "MIT",
      },
    },
    servers: [{ url: SITE_URL }],
    security: [],
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
    ],
    paths: {
      "/init": {
        get: {
          operationId: "generateInitializationPreset",
          summary: "Generate an initialization preset",
          tags: ["Initialization"],
          parameters: [
            {
              name: "base",
              in: "query",
              schema: { type: "string", const: "base", default: "base" },
            },
            {
              name: "style",
              in: "query",
              schema: {
                type: "string",
                enum: ["default", "crisp", "mono", "editorial"],
                default: "default",
              },
            },
            ...["baseColor", "theme"].map((name) => ({
              name,
              in: "query",
              schema: {
                type: "string",
                enum: [
                  "neutral",
                  "zinc",
                  "stone",
                  "mauve",
                  "olive",
                  "mist",
                  "taupe",
                ],
                default: "neutral",
              },
            })),
            {
              name: "font",
              in: "query",
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
              schema: { type: "boolean", default: false },
            },
            {
              name: "pointer",
              in: "query",
              schema: { type: "boolean", default: false },
            },
            {
              name: "menuAccent",
              in: "query",
              schema: {
                type: "string",
                enum: ["subtle", "bold"],
                default: "subtle",
              },
            },
            {
              name: "menuColor",
              in: "query",
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
              schema: {
                type: "string",
                enum: ["default", "none", "small", "medium", "large"],
                default: "default",
              },
            },
            {
              name: "only",
              in: "query",
              description: "Comma-separated subset: theme, font, or fonts.",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": jsonResponse(registryDocumentSchema),
            "400": errorResponse("The preset configuration is invalid."),
          },
        },
      },
      "/r/index.json": {
        get: {
          operationId: "listRegistryItems",
          summary: "List every registry item",
          tags: ["Registry"],
          responses: {
            "200": jsonResponse({
              type: "array",
              items: { $ref: "#/components/schemas/RegistryIndexItem" },
            }),
          },
        },
      },
      "/r/registry.json": {
        get: {
          operationId: "getRegistryCatalog",
          summary: "Get the public registry catalog",
          tags: ["Registry"],
          responses: { "200": jsonResponse(registryDocumentSchema) },
        },
      },
      "/r/{name}.json": {
        get: {
          operationId: "getRegistryItem",
          summary: "Get a registry item",
          tags: ["Registry"],
          parameters: [
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^[a-z0-9-]+$" },
            },
          ],
          responses: {
            "200": jsonResponse(registryDocumentSchema),
            "404": errorResponse("No registry item has the requested name."),
          },
        },
      },
      "/r/colors/{name}.json": {
        get: {
          operationId: "getRegistryBaseColor",
          summary: "Get the registry base-color definition",
          tags: ["Registry"],
          parameters: [
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^[a-z0-9-]+$" },
            },
          ],
          responses: { "200": jsonResponse(registryDocumentSchema) },
        },
      },
      "/.well-known/agent-skills/index.json": {
        get: {
          operationId: "getAgentSkillsIndex",
          summary: "Get the agent skills discovery index",
          tags: ["Agent discovery"],
          responses: {
            "200": jsonResponse({
              $ref: "#/components/schemas/AgentSkillsIndex",
            }),
          },
        },
      },
      "/openapi.json": {
        get: {
          operationId: "getOpenApiDocument",
          summary: "Get this OpenAPI document",
          tags: ["Agent discovery"],
          responses: { "200": jsonResponse({ type: "object" }) },
        },
      },
    },
    components: {
      schemas: {
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
      },
    },
  };
}
