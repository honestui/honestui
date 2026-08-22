import { absoluteUrl } from "@/lib/utils";

// Discovery metadata for the Honest UI MCP server, following the Server Card
// extension specification (SEP-2127):
// https://github.com/modelcontextprotocol/experimental-ext-server-card
//
// - AI Catalog (domain-level entry point): /.well-known/ai-catalog.json
// - Server Card (recommended hosted location): <streamable-http-url>/server-card
//
// Cards deliberately exclude primitives (tools) and capabilities; those are
// discovered at runtime through tools/list and server/discover.

export const MCP_PROTOCOL_VERSION = "2026-07-28";
export const MCP_SERVER_NAME = "honest-ui";
export const MCP_SERVER_VERSION = "1.0.0";

export const SERVER_CARD_MEDIA_TYPE = "application/mcp-server-card+json";
export const AI_CATALOG_MEDIA_TYPE = "application/ai-catalog+json";

const SERVER_CARD_SCHEMA_URL =
  "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json";

export function getMcpServerCard() {
  return {
    $schema: SERVER_CARD_SCHEMA_URL,
    // Reverse-DNS catalog name; the runtime serverInfo name stays "honest-ui".
    name: "com.honestui/honest-ui",
    title: "Honest UI Registry MCP Server",
    description:
      "Read-only MCP tools to list Honest UI registry items and fetch component source.",
    version: MCP_SERVER_VERSION,
    websiteUrl: absoluteUrl(""),
    repository: {
      source: "github",
      url: "https://github.com/honestui/honestui",
    },
    remotes: [
      {
        type: "streamable-http",
        url: absoluteUrl("/mcp"),
        supportedProtocolVersions: [MCP_PROTOCOL_VERSION],
      },
    ],
  };
}

export function getMcpAiCatalog() {
  return {
    specVersion: "1.0",
    entries: [
      {
        identifier: "urn:air:honestui.com:mcp:honest-ui",
        type: SERVER_CARD_MEDIA_TYPE,
        url: absoluteUrl("/mcp/server-card"),
      },
    ],
  };
}
