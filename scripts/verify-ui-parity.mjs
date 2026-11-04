import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const siteRoot = "components/ui"
const registryRoot = "registry/default/ui"
const packageRoot = "package/honestui/registry/default/ui"
// These are site infrastructure, rather than registry components.
const siteOnly = new Set(["kbd.tsx", "sidebar.tsx"])
const normalize = (source) => source
  .replaceAll("@/registry/default/ui/", "@/components/ui/")
  .replaceAll("\r\n", "\n")

let count = 0
for (const file of await readdir(siteRoot)) {
  if (!file.endsWith(".tsx") || siteOnly.has(file)) continue
  const [site, registry, packaged] = await Promise.all(
    [siteRoot, registryRoot, packageRoot].map((root) => readFile(path.join(root, file), "utf8"))
  )
  assert.equal(normalize(site), normalize(registry), `${file}: site and registry differ`)
  assert.equal(registry, packaged, `${file}: package registry differs`)
  count++
}
console.log(`Verified ${count} shared UI components across site, registry, and package.`)
