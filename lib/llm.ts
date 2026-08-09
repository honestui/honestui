import fs from "fs"
import path from "path"
import { source } from "@/lib/source"

const showcaseItems = [
  {
    name: "Components",
    description: "Copy accessible React components into your own codebase.",
    url: "/docs/component-guide",
  },
  {
    name: "Charts",
    description: "Build composable data visualizations for product interfaces.",
    url: "/docs/charts",
  },
  {
    name: "Icons",
    description: "Use a consistent, themeable icon set across your interface.",
    url: "/docs/icons",
  },
  {
    name: "Animated",
    description: "Add purposeful, reduced-motion-aware interactions to product interfaces.",
    url: "/docs/animated",
  },
]

const packageInstallCommands = {
  npm: "npm install",
  yarn: "yarn add",
  bun: "bun add",
  pnpm: "pnpm add",
}

const honestUiCliCommands = {
  npm: "npx honestui@latest add",
  yarn: "yarn dlx honestui@latest add",
  bun: "bunx --bun honestui@latest add",
  pnpm: "pnpm dlx honestui@latest add",
}

function getComponentsList() {
  const components = source.pageTree.children.find(
    (page) => page.$id === "components"
  )

  if (components?.type !== "folder") {
    return ""
  }

  const list = components.children.filter(
    (component) => component.type === "page"
  )

  return list
    .map((component) => `- [${component.name}](${component.url})`)
    .join("\n")
}

function parseCommands(commands: string) {
  return [...commands.matchAll(/["']([^"']+)["']/g)].map((match) => match[1])
}

function getAttribute(tag: string, name: string) {
  return tag.match(new RegExp(`${name}="([^"]+)"`))?.[1]
}

function renderPackageCommands(
  commands: string,
  commandMap: Record<string, string>,
) {
  const packages = parseCommands(commands)
    .map((command) => command.replace(/^@honestui\//, ""))
    .join(" ")

  return Object.entries(commandMap)
    .map(([manager, command]) => `### ${manager}\n\n\`\`\`bash\n${command} ${packages}\n\`\`\``)
    .join("\n\n")
}

function stripMdxComponentTags(content: string) {
  return content
    .replace(/<CodeTabs(?:\s[^>]*)?>/g, "")
    .replace(/<\/CodeTabs>/g, "")
    .replace(/<TabsList(?:\s[^>]*)?>[\s\S]*?<\/TabsList>/g, "")
    .replace(/<TabsPanel(?:\s[^>]*)?>/g, "")
    .replace(/<\/TabsPanel>/g, "")
    .replace(/<Alert(?:\s[^>]*)?>/g, "> ")
    .replace(/<\/Alert>/g, "")
    .replace(/<AlertContent(?:\s[^>]*)?>/g, "")
    .replace(/<\/AlertContent>/g, "")
    .replace(/<Steps[^>]*>/g, "")
    .replace(/<\/Steps>/g, "")
    .replace(/<Step(?:\s[^>]*)?>/g, "")
    .replace(/<\/Step>/g, "")
    .replace(/<StepContent(?:\s[^>]*)?>/g, "")
    .replace(/<\/StepContent>/g, "")
    .replace(/<StepTitle(?:\s[^>]*)?>([\s\S]*?)<\/StepTitle>/g, "### $1")
    .replace(/<StepDescription(?:\s[^>]*)?>([\s\S]*?)<\/StepDescription>/g, "$1")
    .replace(/<ApiTable[^>]*>/g, "")
    .replace(/<\/ApiTable>/g, "")
    .replace(
      /<ApiRow\s+([\s\S]*?)>([\s\S]*?)<\/ApiRow>/g,
      (_match, attrs: string, description: string) => {
        const name = attrs.match(/name="([^"]*)"/)?.[1] ?? "";
        const typeMatch = attrs.match(/type=(?:"([^"]*)"|'([^']*)')/);
        const type = typeMatch ? (typeMatch[1] ?? typeMatch[2] ?? "") : "";
        const defaultMatch = attrs.match(/default=(?:"([^"]*)"|'([^']*)')/);
        const defaultValue = defaultMatch ? (defaultMatch[1] ?? defaultMatch[2] ?? "") : "";
        const required = /(?:^|\s)required(?:\s|$)/.test(attrs);
        const meta = [type && `type: \`${type}\``, defaultValue && `default: \`${defaultValue}\``]
          .filter(Boolean)
          .join(" · ");
        return `### \`${name}\`${required ? " (required)" : ""}\n\n${meta}\n\n${description.trim()}`;
      },
    )
    .replace(/<Link\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/Link>/g, "[$2]($1)")
    .replace(/<ShowcaseGrid\s*\/>/g, getShowcaseList())
}

function getShowcaseList() {
  return showcaseItems
    .map((item) => `- [${item.name}](${item.url}) - ${item.description}`)
    .join("\n")
}

function renderRegistrySource(
  name: string,
  title: string | undefined,
  kind: "component" | "example",
) {
  if (!/^[a-z0-9-]+$/.test(name)) {
    return undefined
  }

  const directories =
    kind === "component"
      ? ["registry/default/ui", "registry/default/animated"]
      : [
          "registry/default/examples",
          "registry/default/examples/charts",
          "registry/default/examples/animated",
        ]
  const absolutePath = directories
    .map((directory) => path.join(process.cwd(), directory, `${name}.tsx`))
    .find((candidate) => fs.existsSync(candidate))

  if (!absolutePath) {
    return undefined
  }

  let src = fs.readFileSync(absolutePath, "utf8")

  // Rewrite internal registry paths to user-facing paths.
  src = src.replaceAll("@/registry/default/ui/", "@/components/honest-ui/ui/")
  src = src.replaceAll("@/registry/default/examples/", "@/components/")
  src = src.replaceAll("@/registry/ui/", "@/components/honest-ui/ui/")
  src = src.replace(
    /(["'])@\/registry\/(?:default\/)?charts\/[^"']+\1/g,
    '"honestui/charts"',
  )
  src = src.replaceAll("@/registry/examples/", "@/components/")
  src = src.replaceAll("@/registry/blocks/", "@/components/honest-ui/blocks/")
  src = src.replaceAll("export default", "export")

  const heading = title ? `### ${title}\n\n` : ""

  return `${heading}\`\`\`tsx
${src}
\`\`\``
}

export function processMdxForLLMs(content: string) {
  content = stripMdxComponentTags(content)

  // Replace <ComponentsList /> with a markdown list of components.
  const componentsListRegex = /<ComponentsList\s*\/>/g
  content = content.replace(componentsListRegex, getComponentsList())

  content = content.replace(
    /<CommandBlock\s+commands=\{\[([\s\S]*?)\]\}\s*\/>/g,
    (_match, commands) => renderPackageCommands(commands, packageInstallCommands),
  )

  content = content.replace(
    /<CliBlock\s+commands=\{\[([\s\S]*?)\]\}\s*\/>/g,
    (_match, commands) => renderPackageCommands(commands, honestUiCliCommands),
  )

  content = content.replace(
    /<ComponentSource[\s\S]*?\/>/g,
    (match) => {
      const name = getAttribute(match, "name")
      const title = getAttribute(match, "title")

      return name ? renderRegistrySource(name, title, "component") ?? match : match
    },
  )

  // Replace <ComponentPreview ... name="xxx" ... /> with actual source code.
  return content.replace(/<ComponentPreview[\s\S]*?\/>/g, (match) => {
    const name = getAttribute(match, "name")
    const title = getAttribute(match, "title")

    if (!name) {
      return match
    }

    try {
      return renderRegistrySource(name, title, "example") ?? match
    } catch (error) {
      console.error(`Error processing ComponentPreview ${name}:`, error)
      return match
    }
  })
}
