import { NEGOTIATED_VARY_HEADER } from "@/lib/content-negotiation";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  return new Response(`# 404: Page not found

Honest UI does not have a page at this URL.

## Where to look next

- [Documentation index](${absoluteUrl("/docs.md")})
- [Agent documentation index](${absoluteUrl("/llms.txt")})
- [OpenAPI specification](${absoluteUrl("/openapi.json")})
- [XML sitemap](${absoluteUrl("/sitemap.xml")})
`, {
    status: 404,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "vary": NEGOTIATED_VARY_HEADER,
      "x-content-type-options": "nosniff",
    },
  });
}
