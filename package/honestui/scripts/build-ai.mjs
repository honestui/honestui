import { build } from "esbuild"
import { readFile, readdir, writeFile, cp } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import postcss from "postcss"
import tailwindcss from "@tailwindcss/postcss"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const aiRoot = path.join(packageRoot, "src/honest-ai")
const pkg = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"))
const components = (await readdir(path.join(aiRoot, "registry/ai"))).filter(name => name.endsWith(".tsx"))
const entries = {
  ai: "src/ai.ts",
  prose: "src/prose.ts",
  syntax: "src/syntax.ts",
  "syntax-browser": "src/syntax-browser.ts",
  "syntax-react": "src/syntax-react.ts",
  "syntax-codemirror": "src/syntax-codemirror.ts",
  "syntax-tailwind": "src/syntax-tailwind.ts",
  "syntax-themes": "src/syntax-themes.ts",
  genui: "src/genui.ts",
  "genui-react": "src/genui-react.ts",
  "genui-chat": "src/genui-chat.ts",
  "genui-server": "src/genui-server.ts",
  "genui-server-openai": "src/genui-server-openai.ts",
  "genui-server-vercel": "src/genui-server-vercel.ts",
  "genui-server-langgraph": "src/genui-server-langgraph.ts",
  "markdown-math": "src/honest-ai/registry/lib/markdown-math.ts",
  "markdown-shiki": "src/honest-ai/registry/lib/markdown-shiki.tsx",
  ...Object.fromEntries(components.map(name => [`ai/${name.slice(0, -4)}`, `src/honest-ai/registry/ai/${name}`])),
}
const clientEntries = new Set(["ai", "genui", "genui-react", "genui-chat", "syntax-react", "markdown-shiki", ...components.map(name => `ai/${name.slice(0, -4)}`)])
const result = await build({
  absWorkingDir: packageRoot, entryPoints: entries, outdir: "dist", bundle: true,
  splitting: true, format: "esm", platform: "browser", target: "es2022", packages: "external",
  external: Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }),
  metafile: true, sourcemap: true, treeShaking: true,
})
for (const entry of clientEntries) {
  const destination = path.join(packageRoot, "dist", `${entry}.js`)
  const source = await readFile(destination, "utf8")
  if (!source.startsWith('"use client"')) await writeFile(destination, `"use client";\n${source}`)
}
// Check the eager graph, including shared chunks, so plain syntax and server
// helpers never acquire React or browser code through code splitting.
for (const entry of ["prose", "syntax", "syntax-browser", "syntax-themes", "syntax-tailwind", "genui-server", "genui-server-openai", "genui-server-vercel"]) {
  const seen = new Set()
  function inspect(file) {
    if (seen.has(file)) return
    seen.add(file)
    const output = result.metafile.outputs[file]
    if (!output) return
    for (const dependency of output.imports) {
      if (dependency.kind === "dynamic-import") continue
      if (dependency.external && /^(?:react(?:\/|$)|react-dom(?:\/|$)|@base-ui|maplibre-gl)/.test(dependency.path)) throw new Error(`${entry} eagerly imports ${dependency.path}`)
      if (!dependency.external) inspect(dependency.path)
    }
  }
  inspect(`dist/${entry}.js`)
}
for (const entry of ["ai/prompt-bar", "ai", "genui-react"]) {
  const seen = new Set()
  function inspect(file) {
    if (seen.has(file)) return
    seen.add(file)
    const output = result.metafile.outputs[file]
    if (!output) return
    const forbidden = entry === "genui-react" ? /honest-ai\/registry\/generative\/(?:catalog|renderers)\// : /honest-ai\/registry\/generative\//
    if (Object.keys(output.inputs).some(input => forbidden.test(input))) throw new Error(`${entry} eagerly includes the generated component catalog or runtime`)
    for (const dependency of output.imports) {
      if (!dependency.external && dependency.kind !== "dynamic-import") inspect(dependency.path)
    }
  }
  inspect(`dist/${entry}.js`)
}
// Workers need self-contained browser output, including lazy Shiki grammar
// chunks. Keep this build separate from the React and CLI bundles.
const worker = await build({
  absWorkingDir: packageRoot,
  entryPoints: { "syntax-worker": "src/honest-ai/registry/lib/prose-syntax-worker.ts" },
  outdir: "dist", bundle: true, splitting: true, format: "esm", platform: "browser",
  target: "es2022", minify: true, chunkNames: "syntax-[hash]", metafile: true,
})
const notices = [await readFile(path.join(aiRoot, "LICENSE"), "utf8"), await readFile(path.join(aiRoot, "registry/generative/LICENSE"), "utf8")]
const workerPackages = new Set(Object.keys(worker.metafile.inputs).flatMap(file => {
  const match = /node_modules\/(@[^/]+\/[^/]+|[^/]+)/.exec(file)
  return match ? [match[1]] : []
}))
for (const name of [...workerPackages].sort()) {
  for (const license of ["LICENSE", "LICENSE.md", "LICENSE.txt", "LICENSE-MIT", "license"]) {
    const text = await readFile(path.join(packageRoot, "node_modules", name, license), "utf8").catch(() => null)
    if (text) { notices.push(`${name}\n${text}`); break }
  }
}
await writeFile(path.join(packageRoot, "dist/AI_THIRD_PARTY_NOTICES.txt"), notices.join("\n\n"))
await cp(path.join(aiRoot, "registry/styles/prose.css"), path.join(packageRoot, "dist/prose.css"))
await cp(path.join(aiRoot, "registry/styles/prose-syntax-theme.css"), path.join(packageRoot, "dist/syntax.css"))
await cp(path.join(aiRoot, "registry/generative/spec.json"), path.join(packageRoot, "dist/genui-spec.json"))
await cp(path.join(aiRoot, "registry/generative/chat-spec.json"), path.join(packageRoot, "dist/genui-chat-spec.json"))
const cssPath = path.join(packageRoot, "src/ai.css")
const css = await postcss([tailwindcss()]).process(await readFile(cssPath, "utf8"), { from: cssPath, map: false })
await writeFile(path.join(packageRoot, "dist/ai.css"), css.css)
const themePath = path.join(packageRoot, "src/theme.css")
const theme = await postcss([tailwindcss()]).process(await readFile(themePath, "utf8"), { from: themePath, map: false })
await writeFile(path.join(packageRoot, "dist/theme.css"), theme.css)
console.log(`Built ${components.length} AI components, prose, syntax, and GenUI entry points.`)
