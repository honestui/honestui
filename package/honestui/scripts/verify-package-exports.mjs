import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import fg from "fast-glob"

const execFileAsync = promisify(execFile)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const listenersBeforeImport = {
  SIGINT: process.listenerCount("SIGINT"),
  SIGTERM: process.listenerCount("SIGTERM"),
}

const [root, icons, logos, vectors, charts, shaders] = await Promise.all([
  import("honestui"),
  import("honestui/icons"),
  import("honestui/logos"),
  import("honestui/vectors"),
  import("honestui/charts"),
  import("honestui/shaders"),
])

assert.equal(process.listenerCount("SIGINT"), listenersBeforeImport.SIGINT)
assert.equal(process.listenerCount("SIGTERM"), listenersBeforeImport.SIGTERM)
assert.equal(typeof root.getRegistry, "function")
assert.equal(typeof root.getRegistryItems, "function")
assert.ok(icons.Search, "honestui/icons must export Search")
assert.ok(logos.Vercel, "honestui/logos must export Vercel")
assert.ok(vectors.Abstract1Shapes, "honestui/vectors must export Abstract1Shapes")
assert.ok(charts.BarChart, "honestui/charts must export BarChart")
assert.ok(shaders.LightRays, "honestui/shaders must export LightRays")
assert.deepEqual(Object.keys(shaders).sort(), [
  "ChromaticImage",
  "DitherShader",
  "GradientBlinds",
  "Grainient",
  "LightRays",
])

for (const [catalogName, catalog] of [
  ["icons", icons.allIcons],
  ["logos", logos.allLogos],
  ["vectors", vectors.allVectors],
]) {
  for (const [categoryName, entries] of Object.entries(catalog)) {
    for (const [exportName, entry] of Object.entries(entries)) {
      assert.equal(
        typeof entry.metadata.variant,
        "string",
        `${catalogName}/${categoryName}/${exportName} must define a metadata variant`
      )
    }
  }
}

const catalogSources = await fg("src/assets/{icons,logos,vectors}/**/*.tsx", {
  absolute: true,
  cwd: packageRoot,
})
for (const sourcePath of catalogSources) {
  const source = await readFile(sourcePath, "utf8")
  assert.doesNotMatch(
    source,
    /^['"]use client['"];?$/m,
    `${path.relative(packageRoot, sourcePath)} must remain server-readable`
  )
}

const chartsCss = await readFile(new URL("../dist/charts.css", import.meta.url), "utf8")
assert.match(chartsCss, /\.animate-spin/)
assert.match(chartsCss, /\.focus-visible\\:outline-2/)

const { stdout: help } = await execFileAsync(
  process.execPath,
  [new URL("../dist/index.js", import.meta.url).pathname, "--help"],
  { encoding: "utf8" }
)
assert.match(help, /add \[options\]/)
assert.doesNotMatch(help, /\beject\b/)
