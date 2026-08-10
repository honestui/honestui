import { processMdxForLLMs } from "@/lib/llm";
import { absoluteUrl } from "@/lib/utils";
import { source } from "@/lib/source";

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
    return new Response("Documentation page not found.\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const raw = await page.data.getText("raw");
  const description = page.data.description ? `\n\n> ${page.data.description}` : "";
  const markdown = `# ${page.data.title}${description}

Source: ${absoluteUrl(page.url)}

${processMdxForLLMs(raw).trim()}
`;

  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}
