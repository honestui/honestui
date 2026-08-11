import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const packageJson = JSON.parse(
  await readFile(path.join(packageRoot, "package.json"), "utf8")
)
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "honestui-artifact-"))

try {
  const { stdout } = await execFileAsync(
    "npm",
    ["pack", "--ignore-scripts", "--json", "--pack-destination", tempRoot],
    { cwd: packageRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  )
  const [packResult] = JSON.parse(stdout)
  const packedFiles = new Set(packResult.files.map((file) => file.path))
  const requiredFiles = [
    "README.md",
    "CHANGELOG.md",
    "package.json",
    "dist/index.js",
    "dist/src/index.d.ts",
    "dist/charts.js",
    "dist/src/charts.d.ts",
    "dist/charts.css",
    "dist/icons.js",
    "dist/src/icons.d.ts",
    "dist/logos.js",
    "dist/src/logos.d.ts",
    "dist/vectors.js",
    "dist/src/vectors.d.ts",
    "dist/shaders.js",
    "dist/src/shaders.d.ts",
    "dist/shaders.css",
  ]

  for (const requiredFile of requiredFiles) {
    assert.ok(packedFiles.has(requiredFile), `Packed package is missing ${requiredFile}`)
  }
  assert.ok(
    Array.from(packedFiles).every((file) => !file.includes("tailwind.css")),
    "Packed package must not contain a package-level tailwind.css file"
  )

  await writeFile(
    path.join(tempRoot, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
    "utf8"
  )
  const tarballPath = path.join(tempRoot, packResult.filename)
  await execFileAsync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarballPath],
    { cwd: tempRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  )
  await writeFile(
    path.join(tempRoot, "smoke.mjs"),
    `
      import assert from "node:assert/strict"
      const before = [process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")]
      const root = await import("honestui")
      const charts = await import("honestui/charts")
      const icons = await import("honestui/icons")
      const logos = await import("honestui/logos")
      const vectors = await import("honestui/vectors")
      const shaders = await import("honestui/shaders")
      assert.equal(typeof root.getRegistry, "function")
      assert.ok(charts.BarChart && icons.Search && logos.Vercel && vectors.Abstract1Shapes && shaders.LightRays)
      assert.deepEqual([process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")], before)
    `,
    "utf8"
  )
  await execFileAsync(process.execPath, [path.join(tempRoot, "smoke.mjs")], {
    cwd: tempRoot,
    encoding: "utf8",
  })

  const installedPackageJson = JSON.parse(
    await readFile(path.join(tempRoot, "node_modules", "honestui", "package.json"), "utf8")
  )
  assert.equal(installedPackageJson.version, packageJson.version)
} finally {
  await rm(tempRoot, { force: true, recursive: true })
}
