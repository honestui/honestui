import { processMdxForLLMs } from "@/lib/llm";
import { absoluteUrl } from "@/lib/utils";
import { source } from "@/lib/source";

const START_HERE_DOCS = new Set([
  "/docs",
  "/docs/get-started",
  "/docs/component-guide",
  "/docs/styling",
  "/docs/accessibility",
  "/docs/contributing",
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
  const animated = pages.filter((page) => page.url.startsWith("/docs/animated"));
  const shaders = pages.filter((page) => page.url.startsWith("/docs/shaders"));

  return `# Honest UI Documentation

> Honest UI provides copied React components and package-based charts, icons, logos, vectors, and shaders. The documentation explains what you own, what remains a dependency, and what your application still needs to verify.

## Start Here
${renderLinks(startHere)}

## Components
${renderLinks(components)}

## Charts
${renderLinks(charts)}

## Icons
${renderLinks(icons)}

## Animated Components
${renderLinks(animated)}

## Shaders
${renderLinks(shaders)}

## Agent Resources
- [Full documentation snapshot](${absoluteUrl("/llms-full.txt")})
- [Agent skill](${absoluteUrl("/skill.md")})
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

> Full Markdown snapshot generated from the same MDX source as the Honest UI documentation site.

${sections.join("\n\n---\n\n")}
`;
}

export function generateSkillMd() {
  return `---
name: honest-ui
description: Add and customize Honest UI components, charts, icons, assets, and shaders in React projects.
license: MIT
compatibility: Requires a React or Next.js project with Tailwind CSS.
metadata:
  source: ${absoluteUrl("/llms.txt")}
---

# Honest UI

Use this skill when a user wants to install, add, customize, or debug Honest UI components, charts, icons, assets, animated components, or shaders.

## Workflow

1. Read \`/llms.txt\` to find the relevant documentation page.
2. Read \`/docs/get-started.md\` before choosing an installation path.
3. Copy UI and animated component source with the Honest UI CLI.
4. Install the \`honestui\` package for charts, icons, logos, vectors, or shaders.
5. Follow the relevant accessibility, styling, fallback, and verification guidance before presenting the work as production-ready.

## Constraints

- Do not describe every Honest UI feature as copied source. Charts, icons, logos, vectors, and shaders remain package dependencies.
- Do not describe a component as accessible without verifying its final content, composition, styling, and behavior in the application.
- Preserve the project's existing React and Tailwind CSS setup unless the user explicitly asks to change it.
- Treat Apache ECharts as the underlying chart dependency.
- Import each package-backed feature from its documented entry point.
- Keep reduced-motion behavior and non-WebGL fallbacks when using animated components or shaders.
`;
}

export function getAgentSkillsIndex() {
  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "honest-ui",
        type: "skill-md",
        description:
          "Add and customize Honest UI components, charts, icons, assets, and shaders in React projects.",
        url: "/.well-known/agent-skills/honest-ui/SKILL.md",
      },
    ],
  };
}
