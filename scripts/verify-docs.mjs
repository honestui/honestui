import fs from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()
const docsRoot = path.join(projectRoot, "content/docs")
const categorySource = fs.readFileSync(
  path.join(projectRoot, "globals/constants/icon-categories.ts"),
  "utf8"
)

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory()
      ? collectFiles(entryPath)
      : entry.name.endsWith(".mdx")
        ? [entryPath]
        : []
  })
}

function categorySlugs(startMarker, endMarker) {
  const start = categorySource.indexOf(startMarker)
  const end = categorySource.indexOf(endMarker, start)
  if (start === -1 || end === -1) return new Set()

  return new Set(
    [...categorySource.slice(start, end).matchAll(/slug: "([^"]+)"/g)].map(
      (match) => match[1]
    )
  )
}

const categoryRoutes = {
  icons: categorySlugs("export const ICON_CATEGORIES", "export const ICON_COUNT"),
  logos: categorySlugs("export const LOGO_CATEGORIES", "export const VECTOR_CATEGORIES"),
  vectors: categorySlugs("export const VECTOR_CATEGORIES", "export const ASSET_CATEGORIES"),
}

function headingSlug(heading) {
  return heading
    .toLowerCase()
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function resolveDocPath(pathname) {
  const relativePath = pathname.replace(/^\/docs\/?/, "")
  const candidates = [
    path.join(docsRoot, `${relativePath}.mdx`),
    path.join(docsRoot, relativePath, "index.mdx"),
  ]

  return candidates.find((candidate) => fs.existsSync(candidate))
}

function dynamicCategoryExists(pathname) {
  const match = pathname.match(
    /^\/docs\/icons\/(?:(logos|vectors)\/)?categories\/([^/]+)$/
  )
  if (!match) return false

  const collection = match[1] ?? "icons"
  return categoryRoutes[collection].has(match[2])
}

const files = collectFiles(docsRoot)
const failures = []
const metadataTitles = new Map()

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
    const existingFile = metadataTitles.get(effectiveTitle)

    if (existingFile) {
      failures.push(
        `${relativeFile}: duplicate metadata title "${effectiveTitle}" also used by ${existingFile}`
      )
    } else {
      metadataTitles.set(effectiveTitle, relativeFile)
    }
  }

  if (!description) {
    failures.push(`${relativeFile}: missing frontmatter description`)
  } else if (!/[.!?]$/.test(description)) {
    failures.push(`${relativeFile}: description must end with punctuation`)
  }

  const markdownLinks = [...source.matchAll(/\]\((\/docs(?:\/[^)\s]+)?)(?:\s+"[^"]*")?\)/g)]
    .map((match) => match[1])
  const jsxLinks = [...source.matchAll(/<(?:Link|a)\b[^>]*\bhref=["'](\/docs[^"']*)["'][^>]*>/g)]
    .map((match) => match[1])

  for (const href of new Set([...markdownLinks, ...jsxLinks])) {
    const [pathname, anchor] = href.split("#")
    const target = resolveDocPath(pathname)

    if (!target && !dynamicCategoryExists(pathname)) {
      failures.push(`${relativeFile}: missing documentation path ${href}`)
      continue
    }

    if (target && anchor) {
      const targetSource = fs.readFileSync(target, "utf8")
      const headings = new Set(
        [...targetSource.matchAll(/^#{1,6}\s+(.+)$/gm)].map((heading) =>
          headingSlug(heading[1])
        )
      )

      if (!headings.has(anchor)) {
        failures.push(`${relativeFile}: missing heading #${anchor} in ${path.relative(projectRoot, target)}`)
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(
  `Validated ${files.length} documentation files: descriptions, internal paths, category routes, and heading anchors are valid.`
)
