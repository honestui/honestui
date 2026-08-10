import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

const projectRoot = process.cwd()
const legacyPrefix = ["--", "r", "s", "-"].join("")
const honestUiPrefix = ["--", "h", "u", "i", "-"].join("")

const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { cwd: projectRoot }
)
  .toString("utf8")
  .split("\0")
  .filter(Boolean)

const failures = []
let honestUiReferenceCount = 0
let honestUiFileCount = 0

for (const relativeFile of files) {
  const file = path.join(projectRoot, relativeFile)

  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue

  const buffer = fs.readFileSync(file)
  if (buffer.includes(0)) continue

  const source = buffer.toString("utf8")
  const legacyIndex = source.indexOf(legacyPrefix)

  if (legacyIndex !== -1) {
    const line = source.slice(0, legacyIndex).split("\n").length
    failures.push(`${relativeFile}:${line}: legacy token prefix found`)
  }

  const references = source.split(honestUiPrefix).length - 1
  if (references > 0) {
    honestUiFileCount += 1
    honestUiReferenceCount += references
  }
}

if (honestUiReferenceCount === 0) {
  failures.push("No Honest UI token references were found.")
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(
  `Validated ${honestUiReferenceCount} Honest UI token references across ${honestUiFileCount} files; no legacy prefix remains.`
)
