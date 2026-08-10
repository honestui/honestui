import { readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const directive = '"use client";\n'

const clientEntries = new Set(["charts.js", "shaders.js"])
const entries = (await readdir(path.join(packageRoot, "dist"))).filter((entry) =>
  entry.endsWith(".js")
)

for (const entry of entries) {
  const entryPath = path.join(packageRoot, "dist", entry)
  let source = await readFile(entryPath, "utf8")
  source = source.replace(
    /(\/\/# sourceMappingURL=[^\n]+)\n\1(?:\n|$)/g,
    "$1\n"
  )

  if (clientEntries.has(entry) && !source.startsWith(directive)) {
    source = `${directive}${source}`
  }

  await writeFile(entryPath, source)
}
