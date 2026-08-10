import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/postcss"
import postcss from "postcss"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const inputPath = path.join(packageRoot, "src", "charts.css")
const outputPath = path.join(packageRoot, "dist", "charts.css")
const input = await readFile(inputPath, "utf8")
const result = await postcss([tailwindcss()]).process(input, {
  from: inputPath,
  map: false,
  to: outputPath,
})

await writeFile(outputPath, result.css, "utf8")
