import { processMdxForLLMs } from "@/lib/llm";
import { absoluteUrl } from "@/lib/utils";
import { source } from "@/lib/source";
import { NEGOTIATED_VARY_HEADER } from "@/lib/content-negotiation";

export const dynamic = "force-static";
export const revalidate = false;

export function generateStaticParams() {
  return source.generateParams();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return new Response(`# 404: Documentation page not found

No Honest UI documentation page exists at this URL.

## Where to look next

- [Documentation index](${absoluteUrl("/docs.md")})
- [Agent documentation index](${absoluteUrl("/llms.txt")})
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

  const processed = await page.data.getText("processed");
  const description = page.data.description ? `\n\n> ${page.data.description}` : "";
  const markdown = `# ${page.data.title}${description}

Source: ${absoluteUrl(page.url)}

${processMdxForLLMs(processed).trim()}
`;

  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "vary": NEGOTIATED_VARY_HEADER,
      "x-content-type-options": "nosniff",
    },
  });
}
