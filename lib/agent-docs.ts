import { processMdxForLLMs } from "@/lib/llm";
import { absoluteUrl } from "@/lib/utils";
import { source } from "@/lib/source";

const START_HERE_DOCS = new Set([
  "/docs",
  "/docs/get-started",
  "/docs/component-guide",
]);

function getMarkdownUrl(pageUrl: string) {
  return pageUrl === "/docs" ? "/docs.md" : `${pageUrl}.md`;
}

function getPageSummary(page: ReturnType<typeof source.getPages>[number]) {
  return {
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    markdownUrl: getMarkdownUrl(page.url),
  };
}

// Absolute URLs on purpose: agents read llms.txt detached from the site, so a
// relative link gives them nothing to resolve against.
function renderLinks(pages: ReturnType<typeof source.getPages>) {
  return pages
    .map((page) => {
      const summary = getPageSummary(page);
      const description = summary.description ? ` - ${summary.description}` : "";
      return `- [${summary.title}](${absoluteUrl(summary.markdownUrl)})${description}`;
    })
    .join("\n");
}

export function getAgentDocPages() {
  return source.getPages();
}

export function generateLlmsTxt() {
  const pages = getAgentDocPages();
  const startHere = pages.filter((page) => START_HERE_DOCS.has(page.url));
  const components = pages.filter((page) => page.url.startsWith("/docs/components/"));
  const charts = pages.filter(
    (page) =>
      page.url === "/docs/charts" ||
      page.url === "/docs/charts/chart-config" ||
      page.url.startsWith("/docs/charts/"),
  );
  const icons = pages.filter((page) => page.url.startsWith("/docs/icons"));

  return `# Honest UI Documentation

> Honest UI is an open-source React UI library with source-first components, charts, and icons.

## Start Here
${renderLinks(startHere)}

## Components
${renderLinks(components)}

## Charts
${renderLinks(charts)}

## Icons
${renderLinks(icons)}

## Agent Resources
- [Full documentation snapshot](${absoluteUrl("/llms-full.txt")})
- [Agent skill](${absoluteUrl("/skill.md")})
- [MCP server](${absoluteUrl("/mcp")})
`;
}

export async function generateLlmsFullTxt() {
  const pages = getAgentDocPages();
  const sections = await Promise.all(
    pages.map(async (page) => {
      const raw = await page.data.getText("raw");
      const content = processMdxForLLMs(raw).trim();
      const summary = getPageSummary(page);
      const description = summary.description ? `\n\n> ${summary.description}` : "";

      return `## ${summary.title}${description}

Source: ${absoluteUrl(summary.url)}
Markdown: ${absoluteUrl(summary.markdownUrl)}

${content}`;
    }),
  );

  return `# Honest UI Full Documentation

> Full markdown snapshot of the Honest UI documentation generated from the same MDX source as honestui.dev.

${sections.join("\n\n---\n\n")}
`;
}

export function generateSkillMd() {
  return `---
name: honest-ui-charts
description: Add and customize Honest UI chart components in React projects.
license: MIT
compatibility: Requires a React or Next.js project with Tailwind CSS.
metadata:
  source: ${absoluteUrl("/llms.txt")}
---

# Honest UI

Use this skill when a user wants to install, add, customize, or debug Honest UI chart components.

## Workflow

1. Read \`/llms.txt\` to find the relevant documentation page.
2. For setup, follow \`/docs/charts/installation.md\`.
3. For chart usage, read the matching chart page such as \`/docs/charts/bar-chart/static.md\`.
4. For shared options, read \`/docs/charts/chart-config.md\`, \`/docs/charts/ui/tooltip.md\`, and \`/docs/charts/ui/legend.md\`.
5. Install the package with \`npm install honestui\` and import charts from \`honestui/charts\`.

## Constraints

- Do not assume Honest UI is a separate charting runtime library.
- Treat Apache ECharts as the underlying chart dependency.
- Chart documentation lives under \`/docs/charts/\`.
- Import chart components and shared chart types from \`honestui/charts\`.
- Use \`chartConfig\` for shared labels, colors, and icons; see \`/docs/charts/chart-config.md\`.
- Preserve the user's existing React and Tailwind CSS setup.
`;
}

export function getAgentSkillsIndex() {
  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "honest-ui-charts",
        type: "skill-md",
        description:
          "Add and customize Honest UI chart components in React projects.",
        url: "/.well-known/agent-skills/honest-ui-charts/SKILL.md",
      },
    ],
  };
}
