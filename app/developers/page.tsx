import type { Metadata } from "next"
import Link from "next/link"

import {
  ContentSection,
  PublicContentLayout,
} from "@/components/public-content-layout"

const linkClass =
  "rounded-[var(--hui-radius-1)] underline underline-offset-4 outline-none focus-visible:[outline:var(--hui-focus-ring)]"

export const metadata: Metadata = {
  title: "Honest UI Developer Resources",
  description:
    "Find the Honest UI CLI, npm package, REST API v1, OpenAPI specification, MCP server, Markdown documentation, and agent instructions.",
  alternates: { canonical: "/developers" },
}

export default function DevelopersPage() {
  return (
    <PublicContentLayout
      description="Use this index to choose the Honest UI integration surface that matches your task: copy component source with the CLI, import maintained collections from npm, or inspect public registry data through the versioned read-only API."
      eyebrow="CLI, API, and agent documentation"
      title="Honest UI Developer Resources"
    >
      <ContentSection id="developer-cli" title="Use the Honest UI CLI for copied source">
        <p>
          Run <code>npx honestui@latest init</code> to configure a supported React project, then run <code>npx honestui@latest add button</code> to inspect and copy a component. Use <code>--dry-run</code> before writing files when you need to review the planned dependencies and targets. The <Link className={linkClass} href="/docs/get-started">Honest UI installation guide</Link> documents prerequisites, prompts, overwrite behavior, verification, and the collections that use package imports instead.
        </p>
        <p>
          The official <a className={linkClass} href="https://www.npmjs.com/package/honestui">honestui package on npm</a> publishes the <code>honestui</code> executable. The same package provides documented imports for charts, icons, logos, vectors, and shaders.
        </p>
      </ContentSection>

      <ContentSection id="developer-api" title="Use REST API v1 for registry discovery">
        <p>
          The <Link className={linkClass} href="/api/v1">Honest UI REST API v1 index</Link> links to the public registry catalog, registry item index, individual items, base colors, and initialization presets. The API is read-only and accepts requests without an account, key, token, cookie, or other credential. New HTTP integrations should use the versioned <code>/api/v1</code> paths rather than the compatibility URLs used by existing CLI consumers.
        </p>
        <p>
          Read the <Link className={linkClass} href="/openapi.json">Honest UI OpenAPI 3.1 specification</Link> for operation IDs, parameters, response schemas, problem details, and lifecycle headers. The <Link className={linkClass} href="/docs/developers">complete API guide</Link> explains stable error codes, versioning, compatibility, and the deprecation policy.
        </p>
      </ContentSection>

      <ContentSection id="developer-agents" title="Use agent-readable documentation for automated work">
        <p>
          Start with <Link className={linkClass} href="/llms.txt">llms.txt</Link> when an agent needs to find the relevant Markdown guide. Use the <Link className={linkClass} href="/skill.md">Honest UI agent skill</Link> when the task involves installing, adding, customizing, or debugging Honest UI in a React project. Use the OpenAPI document when code needs to call a registry endpoint or generate a typed client. The <Link className={linkClass} href="/llms-full.txt">full Markdown snapshot</Link> is available when a tool benefits from one consolidated documentation file.
        </p>
        <p>
          Connect an MCP client to <code>https://www.honestui.com/mcp</code> over Streamable HTTP when the agent needs to discover exact registry item names and retrieve component source through typed, read-only tools. No credential is required. Call <code>list_registry_items</code> first when the item name is unknown, then pass an exact returned name to <code>get_registry_item</code>.
        </p>
      </ContentSection>

      <ContentSection id="developer-support" title="Report a developer-resource problem">
        <p>
          If a command, schema, example, or endpoint contradicts deployed behavior, use the <Link className={linkClass} href="/contact">Honest UI contact guide</Link> to file a reproducible issue. Do not put credentials, private source, personal data, or suspected vulnerability details in a public report.
        </p>
      </ContentSection>
    </PublicContentLayout>
  )
}
