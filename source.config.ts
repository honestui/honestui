import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { pageSchema } from "fumadocs-core/source/schema";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
    schema: pageSchema.extend({
      image: z.string().optional(),
      links: z.record(z.string(), z.string()).optional(),
      metaTitle: z.string().optional(),
    }),
  },
});

export const comparisons = defineDocs({
  dir: "content/compare",
  docs: {
    schema: pageSchema.extend({
      author: z.string().min(1).optional(),
      authorUrl: z.url().optional(),
      competitor: z.string().min(1),
      description: z.string().min(1),
      draft: z.boolean().default(true),
      image: z.string().optional(),
      metaTitle: z.string().min(1),
      publishedAt: z.iso.date().optional(),
      reviewedBy: z.string().min(1).optional(),
      sources: z.array(z.url()).min(1).optional(),
      updatedAt: z.iso.date().optional(),
    }),
  },
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "github-light-high-contrast",
        dark: "github-dark-high-contrast",
      },
    },
  },
});
