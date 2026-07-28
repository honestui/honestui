import { promises as fs } from "fs"
import path from "path"
import { HONESTUI_URL } from "@/src/registry/constants"
import { getConfig } from "@/src/utils/get-config"
import {
  formatMonorepoMessage,
  getMonorepoTargets,
  isMonorepoRoot,
} from "@/src/utils/get-monorepo-info"
import { getPackageInfo } from "@/src/utils/get-package-info"
import { getPackageManager } from "@/src/utils/get-package-manager"
import { handleError } from "@/src/utils/handle-error"
import { highlighter } from "@/src/utils/highlighter"
import { logger } from "@/src/utils/logger"
import { spinner } from "@/src/utils/spinner"
import { Command } from "commander"
import { execa } from "execa"
import fsExtra from "fs-extra"
import prompts from "prompts"
import { z } from "zod"

export const HONESTUI_TAILWIND_IMPORT =
  /@import\s+["']honestui\/tailwind\.css["'];?\s*\n?/

export const ejectOptionsSchema = z.object({
  cwd: z.string(),
  yes: z.boolean(),
  silent: z.boolean(),
})

export const eject = new Command()
  .name("eject")
  .description("inline honestui/tailwind.css and remove the honestui dependency")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-s, --silent", "mute output.", false)
  .action(async (opts) => {
    try {
      const options = ejectOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        yes: opts.yes,
        silent: opts.silent,
      })

      await runEject(options)
    } catch (error) {
      handleError(error)
    }
  })

export async function runEject(options: z.infer<typeof ejectOptionsSchema>) {
  if (!fsExtra.existsSync(path.resolve(options.cwd, "components.json"))) {
    if (await isMonorepoRoot(options.cwd)) {
      const targets = await getMonorepoTargets(options.cwd)
      if (targets.length > 0) {
        formatMonorepoMessage("eject", targets)
        process.exit(1)
      }
    }

    logger.break()
    logger.error(
      `No ${highlighter.info("components.json")} found. Run ${highlighter.info("honestui init")} first.`
    )
    logger.error(
      `Learn more at ${highlighter.info(`${HONESTUI_URL}/docs/components-json`)}.`
    )
    logger.break()
    process.exit(1)
  }

  const config = await getConfig(options.cwd)
  if (!config?.resolvedPaths.tailwindCss) {
    logger.break()
    logger.error(
      "Could not resolve the Tailwind CSS file from components.json."
    )
    logger.break()
    process.exit(1)
  }

  const cssFilepath = config.resolvedPaths.tailwindCss
  const cssFilepathRelative = path.relative(options.cwd, cssFilepath)
  let cssContent = await fs.readFile(cssFilepath, "utf8")

  if (!HONESTUI_TAILWIND_IMPORT.test(cssContent)) {
    logger.break()
    logger.error(
      `Could not find ${highlighter.info('@import "honestui/tailwind.css"')} in ${highlighter.info(cssFilepathRelative)}.`
    )
    logger.error("Nothing to eject.")
    logger.break()
    process.exit(1)
  }

  const packageInfo = getPackageInfo(options.cwd, false)
  const honestUiVersion = getHonestUiVersion(packageInfo)
  const honestUiCssPath = resolveHonestUiTailwindCss(options.cwd)
  const honestUiCssContent = await fs.readFile(honestUiCssPath, "utf8")

  if (!options.silent) {
    logger.break()
    logger.warn(
      "This action is not reversible. Future Honest UI CLI updates to tailwind.css will not apply automatically."
    )
    logger.break()
  }

  if (!options.yes) {
    logger.log("This will:")
    logger.log(
      `  - Inline ${highlighter.info("honestui/tailwind.css")} into ${highlighter.info(cssFilepathRelative)}`
    )
    logger.log(`  - Remove the ${highlighter.info("honestui")} dependency`)
    logger.break()

    const { proceed } = await prompts({
      type: "confirm",
      name: "proceed",
      message: "Proceed?",
      initial: false,
    })

    if (!proceed) {
      process.exit(0)
    }
  }

  const ejectSpinner = spinner(
    `Inlining ${highlighter.info("honestui/tailwind.css")}.`,
    {
      silent: options.silent,
    }
  )?.start()

  cssContent = cssContent.replace(
    HONESTUI_TAILWIND_IMPORT,
    () =>
      `/* ejected from honestui@${honestUiVersion} */\n${honestUiCssContent.trim()}\n\n`
  )

  await fs.writeFile(cssFilepath, cssContent, "utf8")
  ejectSpinner?.succeed()

  if (hasHonestUiDependency(packageInfo)) {
    const removeSpinner = spinner(`Removing ${highlighter.info("honestui")}.`, {
      silent: options.silent,
    })?.start()

    await removeHonestUiDependency(options.cwd)
    removeSpinner?.succeed()
  } else if (!options.silent) {
    logger.warn(
      `The ${highlighter.info("honestui")} package was not found in package.json. Skipped removal.`
    )
  }

  logger.break()
  logger.log(
    `Ejected ${highlighter.info("honestui/tailwind.css")} into ${highlighter.info(cssFilepathRelative)}.`
  )
  logger.break()
}

function getHonestUiVersion(packageInfo: ReturnType<typeof getPackageInfo>) {
  if (!packageInfo) {
    return "unknown"
  }

  return (
    packageInfo.dependencies?.["honestui"] ??
    packageInfo.devDependencies?.["honestui"] ??
    "unknown"
  )
    .replace(/^[\^~]/, "")
    .trim()
}

function hasHonestUiDependency(packageInfo: ReturnType<typeof getPackageInfo>) {
  if (!packageInfo) {
    return false
  }

  return Boolean(
    packageInfo.dependencies?.["honestui"] ||
      packageInfo.devDependencies?.["honestui"]
  )
}

function resolveHonestUiTailwindCss(cwd: string) {
  const projectCss = path.join(cwd, "node_modules/honestui/dist/tailwind.css")
  if (fsExtra.existsSync(projectCss)) {
    return projectCss
  }

  const cliRoot = process.argv[1]
    ? path.dirname(path.resolve(process.argv[1]))
    : cwd

  for (const candidate of [
    path.join(cliRoot, "tailwind.css"),
    path.join(cliRoot, "dist", "tailwind.css"),
    path.join(cliRoot, "src", "tailwind.css"),
    path.join(process.cwd(), "src/tailwind.css"),
    path.join(process.cwd(), "dist/tailwind.css"),
  ]) {
    if (fsExtra.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error("Could not resolve honestui/tailwind.css.")
}

async function removeHonestUiDependency(cwd: string) {
  const packageManager = await getPackageManager(cwd)

  switch (packageManager) {
    case "npm":
      await execa("npm", ["uninstall", "honestui"], { cwd })
      break
    case "pnpm":
      await execa("pnpm", ["remove", "honestui"], { cwd })
      break
    case "yarn":
      await execa("yarn", ["remove", "honestui"], { cwd })
      break
    case "bun":
      await execa("bun", ["remove", "honestui"], { cwd })
      break
    case "deno": {
      const packageJsonPath = path.join(cwd, "package.json")
      const packageJson = await fsExtra.readJson(packageJsonPath)

      for (const field of ["dependencies", "devDependencies"] as const) {
        if (packageJson[field]?.["honestui"]) {
          delete packageJson[field]["honestui"]
        }
      }

      await fsExtra.writeJson(packageJsonPath, packageJson, { spaces: 2 })
      break
    }
  }
}
