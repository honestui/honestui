import fs from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()
const themeRoot = path.join(projectRoot, "content/docs/theme")
const requiredPages = [
  "overview",
  "tailwind",
  "colors",
  "typography",
  "spacing",
  "radius",
  "effects",
]
const styleFiles = [
  "styles/colors.css",
  "styles/typography.css",
  "styles/spacing.css",
  "styles/radius.css",
  "styles/effects.css",
]
const failures = []

for (const page of requiredPages) {
  const file = path.join(themeRoot, `${page}.mdx`)
  if (!fs.existsSync(file)) {
    failures.push(`content/docs/theme/${page}.mdx: required theme page is missing`)
  }
}

const metaPath = path.join(themeRoot, "meta.json")
if (!fs.existsSync(metaPath)) {
  failures.push("content/docs/theme/meta.json: theme navigation is missing")
} else {
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"))
  if (JSON.stringify(meta.pages) !== JSON.stringify(requiredPages)) {
    failures.push(
      `content/docs/theme/meta.json: expected pages in this order: ${requiredPages.join(", ")}`
    )
  }
}

const tokenPattern = /--hui-[a-z0-9]+(?:-[a-z0-9]+)*/g
const declarationPattern = /--hui-[a-z0-9]+(?:-[a-z0-9]+)*(?=\s*:)/g
const sourceTokens = new Set()

for (const relativeFile of styleFiles) {
  const source = fs.readFileSync(path.join(projectRoot, relativeFile), "utf8")
  for (const match of source.matchAll(declarationPattern)) {
    sourceTokens.add(match[0])
  }
}

const themeSource = requiredPages
  .map((page) => {
    const file = path.join(themeRoot, `${page}.mdx`)
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""
  })
  .join("\n")
const documentedTokens = new Set(
  [...themeSource.matchAll(tokenPattern)]
    .map((match) => match[0])
    .filter((token) => sourceTokens.has(token))
)

for (const family of ["base", "black", "white"]) {
  for (let step = 1; step <= 12; step += 1) {
    documentedTokens.add(`--hui-color-overlay-${family}-a${step}`)
  }
}

for (const family of [
  "sky",
  "mint",
  "lime",
  "grass",
  "green",
  "jade",
  "cyan",
  "blue",
  "iris",
  "purple",
  "pink",
  "crimson",
  "orange",
  "gold",
]) {
  for (const step of [6, 8, 9, 11]) {
    documentedTokens.add(`--hui-color-viz-${family}-${step}`)
  }
}

for (const token of sourceTokens) {
  if (!documentedTokens.has(token)) {
    failures.push(`Theme reference does not document ${token}`)
  }
}

const tokenTables = [...themeSource.matchAll(/<TokenTable\b/g)].length
const captions = [...themeSource.matchAll(/\bcaption="[^"]+"/g)].length
if (tokenTables !== captions) {
  failures.push(
    `Theme reference has ${tokenTables} TokenTable instances but ${captions} accessible captions`
  )
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(
  `Validated ${requiredPages.length} theme pages and complete coverage of ${sourceTokens.size} public theme tokens.`
)
