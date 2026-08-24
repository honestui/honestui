import { generateLlmsFullTxt } from "@/lib/agent-docs";
import { NON_HTML_ROBOTS_HEADER } from "@/lib/content-negotiation";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  return new Response(await generateLlmsFullTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...NON_HTML_ROBOTS_HEADER,
    },
  });
}
