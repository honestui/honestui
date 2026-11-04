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

// theme.css already includes the component style. soft.css stays as a copy so
// apps that imported it before the styles were merged keep building.
await copyFile(
  path.join(packageRoot, "src", "style.css"),
  path.join(packageRoot, "dist", "soft.css")
)
