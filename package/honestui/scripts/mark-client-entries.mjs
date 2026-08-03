import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const directive = '"use client";\n'

for (const entry of ["charts.js", "shaders.js"]) {
  const entryPath = path.join(packageRoot, "dist", entry)
  const source = await readFile(entryPath, "utf8")

  if (!source.startsWith(directive)) {
    await writeFile(entryPath, `${directive}${source}`)
  }
}
