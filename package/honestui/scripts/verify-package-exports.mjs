import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
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
  "GradientBlinds",
  "Grainient",
  "LightRays",
])

const chartsCss = await readFile(new URL("../dist/charts.css", import.meta.url), "utf8")
const shadersCss = await readFile(new URL("../dist/shaders.css", import.meta.url), "utf8")
assert.match(chartsCss, /\.animate-spin/)
assert.match(chartsCss, /\.focus-visible\\:outline-2/)
assert.match(shadersCss, /gradient-blinds-container/)

const { stdout: help } = await execFileAsync(
  process.execPath,
  [new URL("../dist/index.js", import.meta.url).pathname, "--help"],
  { encoding: "utf8" }
)
assert.match(help, /add \[options\]/)
assert.doesNotMatch(help, /\beject\b/)
