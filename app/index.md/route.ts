import { generateHomeMarkdown } from "@/lib/agent-docs";
import { NEGOTIATED_VARY_HEADER } from "@/lib/content-negotiation";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  return new Response(generateHomeMarkdown(), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "vary": NEGOTIATED_VARY_HEADER,
      "x-content-type-options": "nosniff",
    },
  });
}
