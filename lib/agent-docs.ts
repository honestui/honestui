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
  "/docs/developers",
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

export function generateHomeMarkdown() {
  return `# Honest UI — Source-First React Components

> Thoughtful React components, charts, icons, and visual effects with good defaults, visible source, and no lock-in.

Honest UI is a React component library. Copy components into your project, change the source, and import charts, icons, and visual effects only when you need them. The project is MIT licensed and source-first by design.

## Start here

- [Get started](${absoluteUrl("/docs/get-started.md")}) — choose the installation path that matches the feature you need.
- [Component guide](${absoluteUrl("/docs/component-guide.md")}) — browse copied React components you can adapt.
- [Full documentation index](${absoluteUrl("/llms.txt")}) — find every agent-readable documentation page.

## Libraries and assets

- [Charts](${absoluteUrl("/docs/charts.md")}) — composable data visualizations for product interfaces.
- [Icons](${absoluteUrl("/docs/icons.md")}) — a consistent, themeable icon set.
- [Animated components](${absoluteUrl("/docs/animated.md")}) — motion components with reduced-motion and fallback guidance.
- [Shaders](${absoluteUrl("/docs/shaders.md")}) — visual effects with WebGL fallbacks.

## Machine-readable resources

- [Honest UI developer resources](${absoluteUrl("/docs/developers.md")})
- [Developer resource index](${absoluteUrl("/developers")})
- [REST API v1](${absoluteUrl("/api/v1")})
- [OpenAPI specification](${absoluteUrl("/openapi.json")})
- [MCP Streamable HTTP server](${absoluteUrl("/mcp")})
- [Full documentation snapshot](${absoluteUrl("/llms-full.txt")})
- [Agent skill](${absoluteUrl("/skill.md")})
- [XML sitemap](${absoluteUrl("/sitemap.xml")})
`;
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

## Honest UI Developer Resources
- [Developer resource index](${absoluteUrl("/developers")}) - Choose the Honest UI CLI, npm package, REST API, OpenAPI specification, or agent documentation.
- [Developer guide, authentication, and REST API policy](${absoluteUrl("/docs/developers.md")}) - Confirm the public API's access model, integrate with its resources, parse errors, and plan for version changes.
- [REST API v1](${absoluteUrl("/api/v1")}) - Discover current public API resources.
- [OpenAPI 3.1 specification](${absoluteUrl("/openapi.json")}) - Read the machine-readable HTTP contract.
- [MCP Streamable HTTP server](${absoluteUrl("/mcp")}) - Discover exact registry names and retrieve component source with typed, read-only tools.
- [Official honestui package](https://www.npmjs.com/package/honestui) - Run the published CLI or import package-backed collections.

## When to use Honest UI
- Use the Honest UI CLI when a React project needs editable UI or animated component source under its own version control.
- Use the \`honestui\` package when a project needs maintained charts, icons, logos, vectors, or shaders.
- Use the REST API or OpenAPI document when software needs to discover registry items or initialization presets without running the CLI.
- Use the MCP server when an agent can call tools directly and needs to list exact registry names or retrieve component source.
- Use the Markdown guides and Honest UI skill when an agent needs installation, customization, accessibility, fallback, or verification guidance.

## How to use Honest UI
1. Read the getting-started guide before choosing a delivery model.
2. Run \`npx honestui@latest init\` for copied components, or install \`honestui\` for a package-backed collection.
3. Inspect a CLI change with \`--dry-run\` before writing files when the project already contains related configuration.
4. Verify the final application behavior, accessibility, styling, fallbacks, and tests; copied source does not transfer those product decisions back to Honest UI.

For MCP clients, connect to \`${absoluteUrl("/mcp")}\` over Streamable HTTP. Call \`list_registry_items\` first when the name is unknown, then call \`get_registry_item\` with an exact returned name. Both tools are public, read-only, and idempotent; no credential is required.

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
- [Honest UI developer resources](${absoluteUrl("/docs/developers.md")})
- [OpenAPI specification](${absoluteUrl("/openapi.json")})
- [MCP Streamable HTTP server](${absoluteUrl("/mcp")})
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
