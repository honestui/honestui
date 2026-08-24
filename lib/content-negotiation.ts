export const NEGOTIATED_VARY_HEADER = "Accept, Accept-Encoding";

// Markdown and plain-text representations duplicate the HTML pages and are
// meant for agents, not search results.
export const NON_HTML_ROBOTS_HEADER = { "x-robots-tag": "noindex" } as const;

type Representation = "html" | "markdown" | "not-acceptable";

type MediaRange = {
  index: number;
  quality: number;
  subtype: string;
  type: string;
};

function parseQuality(parameters: string[]) {
  const qualityParameter = parameters.find((parameter) =>
    parameter.trim().toLowerCase().startsWith("q="),
  );

  if (!qualityParameter) return 1;

  const quality = Number(qualityParameter.split("=", 2)[1]);
  return Number.isFinite(quality) && quality >= 0 && quality <= 1
    ? quality
    : 0;
}

function parseAcceptHeader(accept: string): MediaRange[] {
  return accept
    .split(",")
    .map((value, index) => {
      const [mediaType, ...parameters] = value.split(";");
      const [type, subtype, ...extraParts] = mediaType
        .trim()
        .toLowerCase()
        .split("/");

      if (!type || !subtype || extraParts.length > 0) return null;

      return {
        index,
        quality: parseQuality(parameters),
        subtype,
        type,
      };
    })
    .filter((range): range is MediaRange => range !== null);
}

function scoreRepresentation(
  ranges: MediaRange[],
  type: string,
  subtype: string,
) {
  const matches = ranges
    .filter(
      (range) =>
        (range.type === "*" || range.type === type) &&
        (range.subtype === "*" || range.subtype === subtype),
    )
    .sort((first, second) => {
      const firstSpecificity =
        Number(first.type !== "*") + Number(first.subtype !== "*");
      const secondSpecificity =
        Number(second.type !== "*") + Number(second.subtype !== "*");
      return (
        secondSpecificity - firstSpecificity || first.index - second.index
      );
    });

  return matches[0] ?? { index: Number.POSITIVE_INFINITY, quality: 0 };
}

export function negotiatePageRepresentation(
  accept: string | null,
): Representation {
  if (!accept?.trim()) return "html";

  const ranges = parseAcceptHeader(accept);
  const markdown = scoreRepresentation(ranges, "text", "markdown");
  const html = scoreRepresentation(ranges, "text", "html");

  if (markdown.quality <= 0 && html.quality <= 0) return "not-acceptable";
  if (markdown.quality > html.quality) return "markdown";
  if (markdown.quality < html.quality) return "html";

  return markdown.index < html.index ? "markdown" : "html";
}
