import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { z } from "zod";

import { getRegistryIndex } from "@/lib/registry-locations";
import { getRegistryItem } from "@/lib/registry";

const registryItemName = z
  .string()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9-]+(?:\.(?:css|ts|tsx))?$/,
    "Use a registry item name from list_registry_items.",
  );

const registryIndexOutput = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
    }),
  ),
});

function createHonestUiMcpServer() {
  const server = new McpServer(
    { name: "honest-ui", version: "1.0.0" },
    {
      instructions:
        "Use list_registry_items to discover exact Honest UI component names, then call get_registry_item to retrieve the shadcn-compatible source. The tools are public and read-only. Do not guess item names.",
      cacheHints: {
        "server/discover": { ttlMs: 3_600_000, cacheScope: "public" },
        "tools/list": { ttlMs: 3_600_000, cacheScope: "public" },
      },
    },
  );

  server.registerTool(
    "list_registry_items",
    {
      title: "List Honest UI registry items",
      description:
        "List valid component names and registry types. Call this before get_registry_item when you do not already have an exact item name.",
      inputSchema: z.object({
        query: z
          .string()
          .trim()
          .max(80)
          .optional()
          .describe("Optional case-insensitive substring used to filter names."),
      }),
      outputSchema: registryIndexOutput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query }) => {
      const normalizedQuery = query?.toLowerCase();
      const items = (await getRegistryIndex()).filter(
        (item) => !normalizedQuery || item.name.includes(normalizedQuery),
      );
      const output = { items };

      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  server.registerTool(
    "get_registry_item",
    {
      title: "Get an Honest UI registry item",
      description:
        "Retrieve one shadcn-compatible registry item, including its source files and dependencies. Use an exact name returned by list_registry_items.",
      inputSchema: z.object({
        name: registryItemName.describe(
          "Exact registry item name returned by list_registry_items.",
        ),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ name }) => {
      const item = await getRegistryItem(name);

      if (!item) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No public Honest UI registry item is named "${name}". Call list_registry_items to find a valid name.`,
            },
          ],
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(item) }],
      };
    },
  );

  return server;
}

export const honestUiMcpHandler = createMcpHandler(createHonestUiMcpServer, {
  legacy: "stateless",
});
