import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { pageSchema } from "fumadocs-core/source/schema";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema.extend({
      image: z.string().optional(),
      links: z.record(z.string(), z.string()).optional(),
    }),
  },
});

export default defineConfig();
