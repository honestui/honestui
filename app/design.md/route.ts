import { readFile } from "node:fs/promises";
import path from "node:path";

import { NON_HTML_ROBOTS_HEADER } from "@/lib/content-negotiation";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const markdown = await readFile(path.join(process.cwd(), "design.md"), "utf8");

  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...NON_HTML_ROBOTS_HEADER,
    },
  });
}
