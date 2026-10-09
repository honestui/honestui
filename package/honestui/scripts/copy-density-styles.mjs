import { copyFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

// density.css ships as source: its @custom-variant rules must reach the
// consumer's Tailwind build unprocessed.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

await copyFile(
  path.join(packageRoot, "src", "density.css"),
  path.join(packageRoot, "dist", "density.css")
)
