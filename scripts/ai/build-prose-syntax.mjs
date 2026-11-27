import { build } from "esbuild"
import { mkdir, readFile, writeFile, cp, rm } from "node:fs/promises"
import { execFileSync } from "node:child_process"

const target = "package/prose-syntax"
const staging = ".next/prose-syntax-source"
await rm(`${target}/dist`, { recursive: true, force: true })
await mkdir(staging, { recursive: true })
await mkdir(`${target}/dist`, { recursive: true })
const names = ["prose-syntax", "prose-syntax-shared", "prose-syntax-worker", "prose-syntax-client", "prose-syntax-browser", "prose-syntax-react", "prose-syntax-tailwind", "prose-syntax-codemirror", "prose-syntax-palettes", "prose-syntax-themes"]
for (const name of names) {
  const extension = name.endsWith("react") ? "tsx" : "ts"
  const source = (await readFile(`registry/honest-ai/lib/${name}.${extension}`, "utf8"))
    .replaceAll(/@\/registry\/lib\/(prose-syntax[\w-]*)/g, "./$1.js")
    .replace('./prose-syntax-worker.ts', './prose-syntax-worker.js')
  await writeFile(`${staging}/${name}.${extension}`, source)
}
await build({
  entryPoints: Object.fromEntries(names.map(name => [name, `${staging}/${name}.${name.endsWith("react") ? "tsx" : "ts"}`])),
  outdir: `${target}/dist`, bundle: true, splitting: true, format: "esm", platform: "browser", target: "es2022",
  external: ["react", "react/jsx-runtime", "@codemirror/*", "@lezer/*"], chunkNames: "chunk-[hash]", minify: true, metafile: true,
}).then(async result => {
  await writeFile(".next/prose-syntax-meta.json", JSON.stringify(result.metafile, null, 2))
  for (const entry of ["prose-syntax", "prose-syntax-browser"]) {
    const seen = new Set()
    function inspect(file) {
      if (seen.has(file)) return
      seen.add(file)
      const output = result.metafile.outputs[file]
      if (!output) return
      if (Object.keys(output.inputs).some(input => /node_modules\/(?:react\/|@shikijs\/(?:langs|themes)\/)/.test(input))) throw new Error(`${entry} eagerly bundles React, grammars, or themes.`)
      for (const dependency of output.imports) {
        if (dependency.kind === "dynamic-import") continue
        if (dependency.external && /^react(?:\/|$)/.test(dependency.path)) throw new Error(`${entry} imports React.`)
        if (!dependency.external) inspect(dependency.path)
      }
    }
    inspect(`${target}/dist/${entry}.js`)
  }
  const packages = new Set(Object.keys(result.metafile.inputs).flatMap(input => {
    const match = /^node_modules\/(@[^/]+\/[^/]+|[^/]+)/.exec(input)
    return match ? [match[1]] : []
  }))
  const notices = []
  for (const name of [...packages].sort()) {
    for (const file of ["LICENSE", "LICENSE.md", "LICENSE.txt", "LICENSE-MIT", "license"]) {
      const license = await readFile(`node_modules/${name}/${file}`, "utf8").catch(() => null)
      if (license) { notices.push(`${name}\n${license}`); break }
    }
  }
  await writeFile(`${target}/dist/THIRD_PARTY_NOTICES.txt`, notices.join("\n\n"))
})
await writeFile(`${staging}/tsconfig.json`, JSON.stringify({ compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, skipLibCheck: true, declaration: true, emitDeclarationOnly: true, outDir: "../../packages/prose-syntax/dist" }, include: ["*.ts", "*.tsx"] }))
execFileSync("node_modules/.bin/tsc", ["-p", `${staging}/tsconfig.json`], { stdio: "inherit" })
await cp("registry/honest-ai/styles/prose-syntax-theme.css", `${target}/dist/style.css`)
// Ready-made VS Code themes, built from the same palettes as the stylesheet.
const { vscodeTheme } = await import(`../${target}/dist/prose-syntax-themes.js`)
await mkdir(`${target}/dist/themes`, { recursive: true })
for (const palette of ["violet", "graphite"]) {
  for (const mode of ["light", "dark"]) {
    await writeFile(`${target}/dist/themes/honest-${palette}-${mode}.json`, JSON.stringify(vscodeTheme(palette, mode), null, 2) + "\n")
  }
}
console.log("Built Honest Prose Syntax: ESM, declarations, worker, grammar chunks, CSS.")
