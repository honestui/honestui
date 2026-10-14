import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/honest-ai")
const manifest = JSON.parse(await readFile(path.join(root, "SOURCE.json"), "utf8"))
for (const [file, hash] of Object.entries(manifest.files)) {
  const content = await readFile(path.join(root, file))
  assert.equal(createHash("sha256").update(content).digest("hex"), hash, `${file} differs from the Honest AI snapshot. Run ${manifest.sync} in honest-ai.`)
}
async function files(directory, prefix = "") {
  return (await Promise.all((await readdir(directory, { withFileTypes: true })).map(entry => entry.isDirectory() ? files(path.join(directory, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]))).flat()
}
assert.deepEqual((await files(root)).filter(file => file !== "SOURCE.json").sort(), Object.keys(manifest.files).sort())
console.log(`Verified ${Object.keys(manifest.files).length} Honest AI snapshot files.`)
