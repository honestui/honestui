#!/usr/bin/env node
import { realpathSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { add } from "./commands/add"
import { apply } from "./commands/apply"
import { build } from "./commands/build"
import { diff } from "./commands/diff"
import { docs } from "./commands/docs"
import { eject } from "./commands/eject"
import { info } from "./commands/info"
import { init } from "./commands/init"
import { migrate } from "./commands/migrate"
import { preset } from "./commands/preset"
import { registry } from "./commands/registry"
import { search } from "./commands/search"
import { view } from "./commands/view"
import { Command } from "commander"

import packageJson from "../package.json"

process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

async function main() {
  const program = new Command()
    .name("honestui")
    .description("build your Honest UI component library")
    .version(
      packageJson.version || "1.0.0",
      "-v, --version",
      "display the version number"
    )

  program
    .addCommand(init)
    .addCommand(apply)
    .addCommand(add)
    .addCommand(diff)
    .addCommand(docs)
    .addCommand(view)
    .addCommand(search)
    .addCommand(migrate)
    .addCommand(eject)
    .addCommand(info)
    .addCommand(build)
    .addCommand(preset)
    .addCommand(registry)

  await program.parseAsync()
}

function isDirectRun() {
  if (!process.argv[1]) return false

  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
  } catch {
    return false
  }
}

if (isDirectRun()) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}

export * from "./registry/api"
