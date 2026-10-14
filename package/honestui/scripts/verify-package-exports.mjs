import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import { glob } from "tinyglobby"

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

const [ai, promptBar, prose, syntax, syntaxReact, genui, genuiChat, genuiServer] = await Promise.all([
  import("honestui/ai"), import("honestui/ai/prompt-bar"), import("honestui/prose"),
  import("honestui/syntax"), import("honestui/syntax/react"), import("honestui/genui"),
  import("honestui/genui/chat"), import("honestui/genui/server"),
])
assert.equal(typeof ai.PromptBar, "function")
assert.equal(typeof promptBar.PromptBar, "function")
assert.equal(typeof prose.repairMarkdown, "function")
assert.equal(typeof prose.proseTailwind, "string")
assert.equal(typeof syntaxReact.SyntaxCode, "function")
assert.equal(typeof genui.Renderer, "function")
assert.ok(genui.honestLibrary)
assert.equal(typeof genuiChat.GenerativeChat, "function")
assert.equal(typeof genuiServer.createParser, "function")
assert.ok(genuiServer.honestChatSpec.schema)
const highlighter = syntax.createHighlighter()
try {
  const result = await highlighter.highlight("const answer = 42", { language: "javascript" })
  assert.ok(result.lines.flat().some(token => token.role !== "plain"))
} finally { highlighter.dispose() }
for (const entry of ["ai.js", "genui.js", "genui-chat.js", "syntax-react.js", "ai/prompt-bar.js"]) {
  assert.match(await readFile(path.join(packageRoot, "dist", entry), "utf8"), /^"use client";/)
}
for (const entry of ["syntax.js", "genui-server.js", "genui-server-openai.js", "genui-server-vercel.js"]) {
  assert.doesNotMatch(await readFile(path.join(packageRoot, "dist", entry), "utf8"), /^"use client";/)
}
for (const stylesheet of ["ai", "prose", "syntax", "theme"]) {
  assert.ok((await readFile(path.join(packageRoot, "dist", `${stylesheet}.css`), "utf8")).length > 100)
}
const { mathPlugins } = await import("honestui/ai/markdown-math")
const { createElement } = await import("react")
const { renderToStaticMarkup } = await import("react-dom/server")
const mathMarkup = renderToStaticMarkup(createElement(ai.Markdown, { ...mathPlugins, children: "$$x^2 + y^2 = z^2$$" }))
assert.match(mathMarkup, /class="katex"/)
assert.doesNotMatch(mathMarkup, /katex-error/)
const [bundledPrompt] = await root.getRegistryItems(["prompt-bar"])
assert.equal(bundledPrompt.files[0].target, "components/ai/prompt-bar.tsx")

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

const catalogSources = await glob("src/assets/{icons,logos,vectors}/**/*.tsx", {
  expandDirectories: false,
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

const densityCss = await readFile(new URL("../dist/density.css", import.meta.url), "utf8")
assert.match(densityCss, /\[data-density="compact"\]/)
assert.match(densityCss, /@custom-variant density-compact/)

const { stdout: help } = await execFileAsync(
  process.execPath,
  [new URL("../dist/index.js", import.meta.url).pathname, "--help"],
  { encoding: "utf8" }
)
assert.match(help, /add \[options\]/)
assert.doesNotMatch(help, /\beject\b/)
