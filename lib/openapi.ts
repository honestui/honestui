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

const initializationParameters = [
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
      enum: ["neutral", "zinc", "stone", "mauve", "olive", "mist", "taupe"],
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
];

const versionedResponseHeaders = {
  "X-Api-Version": { $ref: "#/components/headers/ApiVersion" },
  Link: { $ref: "#/components/headers/DeprecationPolicyLink" },
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

const registryNameParameter = {
  name: "name",
  in: "path",
  required: true,
  schema: { type: "string", pattern: "^[a-z0-9-]+$" },
};

export function getOpenApiDocument() {
  return {
    openapi: "3.1.1",
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    info: {
      title: "Honest UI Registry API",
      version: "1.0.0",
      description:
        "Versioned, read-only endpoints for discovering Honest UI registry items and generating shadcn-compatible initialization presets. New integrations should use /api/v1; the unversioned /r and /init paths remain compatibility aliases.",
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
      description: "Honest UI developer resources and API lifecycle policy",
      url: `${SITE_URL}/docs/developers`,
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
          },
        },
      },
      "/api/v1/init": {
        get: {
          operationId: "generateInitializationPresetV1",
          summary: "Generate an initialization preset",
          tags: ["Initialization"],
          parameters: initializationParameters,
          responses: {
            "200": versionedJsonResponse(registryDocumentSchema),
            "400": problemResponse("The preset configuration is invalid."),
            "405": problemResponse("The HTTP method is not supported."),
          },
        },
      },
      "/api/v1/registry": {
        get: {
          operationId: "getRegistryCatalogV1",
          summary: "Get the public registry catalog",
          tags: ["Registry"],
          responses: {
            "200": versionedJsonResponse(registryDocumentSchema),
            "405": problemResponse("The HTTP method is not supported."),
          },
        },
      },
      "/api/v1/registry/index": {
        get: {
          operationId: "listRegistryItemsV1",
          summary: "List every registry item",
          tags: ["Registry"],
          responses: {
            "200": versionedJsonResponse({
              type: "array",
              items: { $ref: "#/components/schemas/RegistryIndexItem" },
            }),
            "405": problemResponse("The HTTP method is not supported."),
          },
        },
      },
      "/api/v1/registry/{name}": {
        get: {
          operationId: "getRegistryItemV1",
          summary: "Get a registry item",
          tags: ["Registry"],
          parameters: [registryNameParameter],
          responses: {
            "200": versionedJsonResponse(registryDocumentSchema),
            "404": problemResponse("No registry item has the requested name."),
            "405": problemResponse("The HTTP method is not supported."),
          },
        },
      },
      "/api/v1/colors/{name}": {
        get: {
          operationId: "getRegistryBaseColorV1",
          summary: "Get the registry base-color definition",
          tags: ["Registry"],
          parameters: [registryNameParameter],
          responses: {
            "200": versionedJsonResponse(registryDocumentSchema),
            "405": problemResponse("The HTTP method is not supported."),
          },
        },
      },
      "/init": {
        get: {
          operationId: "generateInitializationPreset",
          summary: "Generate an initialization preset",
          tags: ["Initialization"],
          parameters: initializationParameters,
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
            "documentation",
            "openapi",
            "resources",
          ],
          properties: {
            name: { type: "string", const: "Honest UI Registry API" },
            version: { type: "string", const: "v1" },
            description: { type: "string" },
            authentication: { type: "string", const: "none" },
            documentation: { type: "string", format: "uri" },
            openapi: { type: "string", format: "uri" },
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
