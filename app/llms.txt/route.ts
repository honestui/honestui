import { generateLlmsTxt } from "@/lib/agent-docs";
import { NON_HTML_ROBOTS_HEADER } from "@/lib/content-negotiation";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  return new Response(generateLlmsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...NON_HTML_ROBOTS_HEADER,
    },
  });
}
