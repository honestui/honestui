import { constants } from "node:fs"
import { access, readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = path.resolve(packageRoot, "..", "..")
const sourceRoot = path.join(repoRoot, "registry")
const targetRoot = path.join(packageRoot, "registry")

await Promise.all([
  access(sourceRoot, constants.R_OK),
  access(targetRoot, constants.R_OK),
])

const sourceFiles = await collectFiles(sourceRoot)
const drift = []

for (const relativePath of sourceFiles) {
  const sourcePath = path.join(sourceRoot, relativePath)
  const targetPath = path.join(targetRoot, relativePath)

  try {
    const [source, target] = await Promise.all([
      readFile(sourcePath),
      readFile(targetPath),
    ])

    if (!source.equals(target)) {
      drift.push(relativePath)
    }
  } catch {
    drift.push(relativePath)
  }
}

if (drift.length > 0) {
  throw new Error(
    `Package registry is out of sync (${drift.length} files). Run npm run sync:registry.\n${drift
      .slice(0, 20)
      .map((file) => `  - ${file}`)
      .join("\n")}`
  )
}

console.log(`Registry verification passed: ${sourceFiles.length} source files match.`)

async function collectFiles(root, baseRoot = root) {
  const files = []
  const entries = await readdir(root, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue

    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, baseRoot)))
    } else if (entry.isFile()) {
      files.push(path.relative(baseRoot, fullPath))
    }
  }

  return files.sort()
}
