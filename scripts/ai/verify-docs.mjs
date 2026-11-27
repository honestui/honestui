import fs from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()
const contentRoot = path.join(projectRoot, "content/docs")
const docsRoot = path.join(contentRoot, "ai")
const examplesRoot = path.join(projectRoot, "registry/honest-ai/examples")
const componentsRoot = path.join(projectRoot, "registry/honest-ai/ai")
// Every place a `ComponentSource` can read from.
const sourceFiles = ["generative-ui", "generative-chat", "generative-server", ...["ai", "lib", "styles"].flatMap((directory) =>
  fs.readdirSync(path.join(projectRoot, "registry/honest-ai", directory)).map((name) => path.parse(name).name)
)]

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return collectFiles(entryPath)
    return entry.name.endsWith(".mdx") ? [entryPath] : []
  })
}

function headingSlug(heading) {
  return heading
    .toLowerCase()
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
}

function resolveDocPath(pathname) {
  const relativePath = pathname.replace(/^\/docs\/?/, "")
  return [
    path.join(contentRoot, `${relativePath}.mdx`),
    path.join(contentRoot, relativePath, "index.mdx"),
    // Interactive docs such as the playground are App Router pages.
    path.join(projectRoot, "app/docs", relativePath, "page.tsx"),
  ].find(
    (candidate) => fs.existsSync(candidate)
  )
}

const files = collectFiles(docsRoot)
const failures = []
const titles = new Map()

for (const file of files) {
  const source = fs.readFileSync(file, "utf8")
  const relativeFile = path.relative(projectRoot, file)
  const title = source.match(/^title:\s*(.+)$/m)?.[1]?.trim()
  const metaTitle = source.match(/^metaTitle:\s*(.+)$/m)?.[1]?.trim()
  const description = source.match(/^description:\s*(.+)$/m)?.[1]?.trim()

  if (!title) {
    failures.push(`${relativeFile}: missing frontmatter title`)
  } else {
    const effectiveTitle = metaTitle ?? title
    if (titles.has(effectiveTitle)) {
      failures.push(`${relativeFile}: duplicate title "${effectiveTitle}" also used by ${titles.get(effectiveTitle)}`)
    }
    titles.set(effectiveTitle, relativeFile)
  }

  if (!description) failures.push(`${relativeFile}: missing frontmatter description`)
  else if (!/[.!?]$/.test(description)) failures.push(`${relativeFile}: description must end with punctuation`)

  for (const match of source.matchAll(/\]\((\/docs(?:\/[^)\s]+)?)\)/g)) {
    const [pathname, anchor] = match[1].split("#")
    const target = resolveDocPath(pathname)
    if (!target) {
      failures.push(`${relativeFile}: missing documentation path ${match[1]}`)
    } else if (anchor) {
      const headings = [...fs.readFileSync(target, "utf8").matchAll(/^#{1,6}\s+(.+)$/gm)].map((heading) =>
        headingSlug(heading[1])
      )
      if (!headings.includes(anchor)) failures.push(`${relativeFile}: missing heading #${anchor} in ${match[1]}`)
    }
  }

  for (const match of source.matchAll(/<ComponentPreview[\s\S]*?name="([^"]+)"/g)) {
    if (!fs.existsSync(path.join(examplesRoot, `${match[1]}.tsx`))) {
      failures.push(`${relativeFile}: preview "${match[1]}" has no example in registry/honest-ai/examples`)
    }
  }

  for (const match of source.matchAll(/<ComponentSource[\s\S]*?name="([^"]+)"/g)) {
    if (!sourceFiles.includes(match[1])) {
      failures.push(`${relativeFile}: source "${match[1]}" has no file in registry/honest-ai/ai, lib, or styles`)
    }
  }
}

// Every component needs a page, or it is installable but undocumented.
for (const file of fs.readdirSync(componentsRoot).filter((name) => name.endsWith(".tsx"))) {
  const slug = file.replace(/\.tsx$/, "")
  if (!fs.existsSync(path.join(docsRoot, `${slug}.mdx`))) {
    failures.push(`${file}: component has no documentation page`)
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(`Validated ${files.length} documentation files: titles, descriptions, internal links, previews, and component coverage.`)
