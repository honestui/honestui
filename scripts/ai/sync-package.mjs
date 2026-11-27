import { build } from "esbuild"
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { createHash } from "node:crypto"

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
process.chdir(sourceRoot)
const targetRoot = path.resolve(process.argv.find(arg => arg.startsWith("--target="))?.slice(9) ?? path.join(sourceRoot, "package/honestui"))
const check = process.argv.includes("--check")
const target = path.join(targetRoot, "src/honest-ai")
const output = new Map()
const staging = path.join(sourceRoot, ".next/honestui-registry.mjs")
await mkdir(path.dirname(staging), { recursive: true })
await build({
  stdin: { contents: 'export { getPublicItems, getRegistryItem } from "./lib/ai/registry"', resolveDir: sourceRoot },
  outfile: staging, bundle: true, platform: "node", format: "esm", packages: "external",
  plugins: [{ name: "omit-docs-previews", setup(context) {
    context.onResolve({ filter: /^@\/registry\/honest-ai\/index$/ }, () => ({ path: "previews", namespace: "empty" }))
    context.onLoad({ filter: /.*/, namespace: "empty" }, () => ({ contents: "export const AiIndex = {}" }))
  } }],
})
const { getPublicItems, getRegistryItem } = await import(staging)
const catalog = await getPublicItems()
const items = {}
for (const { name } of catalog) {
  const item = await getRegistryItem(name)
  items[name] = {
    name, type: item.type,
    ...(item.dependencies.length && { dependencies: item.dependencies }),
    ...((item.honestUiDependencies.length || item.localDependencies.length) && {
      registryDependencies: [...new Set([...item.honestUiDependencies, ...item.localDependencies])].map(name => `@honestui/${name}`),
    }),
    files: item.files,
    ...(name === "prose" || name === "prose-syntax-theme" ? { docs: `Import the installed styles/${item.files[0].path} stylesheet once in your application root.` } : {}),
  }
}
output.set("registry-items.json", JSON.stringify(items, null, 2) + "\n")
output.set("registry-catalog.json", JSON.stringify(catalog, null, 2) + "\n")

async function collect(directory) {
  const entries = await readdir(path.join(sourceRoot, directory), { withFileTypes: true })
  return (await Promise.all(entries.map(entry => {
    if (entry.name === "__tests__" || /\.test\./.test(entry.name)) return []
    const file = `${directory}/${entry.name}`
    return entry.isDirectory() ? collect(file) : /\.(?:ts|tsx|css|json)$/.test(entry.name) || entry.name === "LICENSE" ? [file] : []
  }))).flat()
}
const pending = [...await collect("registry/honest-ai/ai"), ...await collect("registry/honest-ai/lib"), ...await collect("registry/honest-ai/styles"), ...await collect("registry/honest-ai/generative"), ...await collect("styles")]

/**
 * The package keeps the layout Honest AI had as its own site: AI source under
 * `registry/`, and the Honest UI pieces it uses under `components/`. Map this
 * repository's paths onto that layout so the package entry points stay put.
 */
function toPackagePath(file) {
  return file
    .replace(/^registry\/honest-ai\//, "registry/")
    .replace(/^registry\/default\/ui\//, "components/ui/")
    .replace(/^registry\/default\/product\//, "components/product/")
    .replace(/^registry\/default\/animated\//, "components/animated/")
}
const seen = new Set()
async function resolveSource(specifier) {
  const base = specifier.slice(2)
  for (const suffix of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const candidate = base + suffix
    if (await readFile(path.join(sourceRoot, candidate)).then(() => true, () => false)) return candidate
  }
  throw new Error(`Cannot resolve source import ${specifier}`)
}
while (pending.length) {
  const file = pending.shift()
  if (seen.has(file)) continue
  seen.add(file)
  let source = await readFile(path.join(sourceRoot, file), "utf8")
  if (/\.tsx?$/.test(file)) {
    const specifiers = new Set(ts.preProcessFile(source, true, true).importedFiles.map(imported => imported.fileName))
    for (const specifier of specifiers) {
      if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue
      const dependency = await resolveSource(specifier.startsWith("@/") ? specifier : `@/${path.posix.join(path.posix.dirname(file), specifier).replace(/\.js$/, "")}`)
      pending.push(dependency)
      if (specifier.startsWith("@/")) {
        const relative = path.posix.relative(path.posix.dirname(toPackagePath(file)), toPackagePath(dependency)).replace(/\.tsx?$/, ".js")
        const replacement = relative.startsWith(".") ? relative : `./${relative}`
        source = source.replaceAll(`"${specifier}"`, `"${replacement}"`).replaceAll(`'${specifier}'`, `'${replacement}'`)
      }
    }
    source = source.replace('"./prose-syntax-worker.ts"', '"./syntax-worker.js"')
  }
  // The site's stylesheet index reads density and style from the package
  // source; inside the package they sit next to it.
  if (file === "styles/index.css") source = source.replaceAll("../package/honestui/src/", "./")
  output.set(toPackagePath(file), source)
}
for (const name of ["density.css", "style.css"]) {
  output.set(`styles/${name}`, await readFile(path.join(sourceRoot, "package/honestui/src", name), "utf8"))
}
output.set("LICENSE", await readFile(path.join(sourceRoot, "LICENSE"), "utf8"))
output.set("ai.ts", '"use client";\n' + [...seen].map(toPackagePath).filter(file => /^registry\/ai\/[^/]+\.tsx$/.test(file)).sort().map(file => `export * from "./${file.replace(/\.tsx$/, ".js")}"\n`).join(""))
output.set("SOURCE.json", JSON.stringify({ source: "honest-ai", sync: "npm run ai:sync", files: Object.fromEntries([...output].sort(([first], [second]) => first < second ? -1 : first > second ? 1 : 0).map(([file, content]) => [file, createHash("sha256").update(content).digest("hex")])) }, null, 2) + "\n")
const drift = []
for (const [file, source] of output) {
  const destination = path.join(target, file)
  if (check) {
    if (await readFile(destination, "utf8").catch(() => null) !== source) drift.push(file)
  } else {
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, source)
  }
}
async function existing(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? existing(path.join(directory, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]))).flat()
}
for (const file of await existing(target)) {
  if (!output.has(file)) {
    if (check) drift.push(file)
    else await rm(path.join(target, file))
  }
}
if (drift.length) throw new Error(`HonestUI AI source is out of sync. Run npm run ai:sync.\n${drift.join("\n")}`)
console.log(`${check ? "Verified" : "Synced"} ${catalog.length} registry items and ${seen.size} source files in ${targetRoot}.`)
