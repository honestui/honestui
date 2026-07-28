import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const shadersEntry = path.join(packageRoot, "dist", "shaders.js")
const directive = '"use client";\n'
const source = await readFile(shadersEntry, "utf8")

if (!source.startsWith(directive)) {
  await writeFile(shadersEntry, `${directive}${source}`)
}
