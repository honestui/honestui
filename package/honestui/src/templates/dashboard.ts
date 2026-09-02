import path from "path"
import { handleError } from "@/src/utils/handle-error"
import { spinner } from "@/src/utils/spinner"
import { execa } from "execa"
import fs from "fs-extra"

import { createTemplate, getInstallArgs } from "./create-template"

const DASHBOARD_REPO_URL = "https://github.com/honestui/honestui-dashboard.git"

// The dashboard template is a complete application, not a starter shell.
// It lives in its own repository (a GitHub template repo) rather than in
// honestui-starters, and ships fully configured — so it is standalone and
// init skips the base/preset flow.
export const dashboard = createTemplate({
  name: "dashboard",
  title: "Analytics Dashboard",
  description:
    "A complete Next.js SaaS analytics dashboard built with HonestUI.",
  defaultProjectName: "analytics-dashboard",
  templateDir: "analytics-dashboard",
  standalone: true,
  create: async () => {
    // Empty for now.
  },
  scaffold: async ({ projectPath, packageManager }) => {
    const createSpinner = spinner(
      `Creating a new Analytics Dashboard project. This may take a few minutes.`
    ).start()

    try {
      const localTemplateDir = process.env.HONESTUI_DASHBOARD_TEMPLATE_DIR
      if (localTemplateDir) {
        // Use a local checkout of the dashboard for development.
        await fs.copy(localTemplateDir, projectPath, {
          filter: (src) => {
            const topLevel = path
              .relative(localTemplateDir, src)
              .split(path.sep)[0]
            return ![".git", ".next", "node_modules"].includes(topLevel)
          },
        })
      } else {
        const repoUrl =
          process.env.HONESTUI_DASHBOARD_URL ?? DASHBOARD_REPO_URL
        await execa("git", ["clone", "--depth", "1", repoUrl, projectPath])
        await fs.remove(path.join(projectPath, ".git"))
      }

      // The template ships an npm lockfile; other package managers
      // create their own on install.
      if (packageManager !== "npm") {
        await fs.remove(path.join(projectPath, "package-lock.json"))
      }

      // Run install.
      const installArgs = getInstallArgs(packageManager)
      await execa(packageManager, ["install", ...installArgs], {
        cwd: projectPath,
      })

      // Write project name to the package.json.
      const packageJsonPath = path.join(projectPath, "package.json")
      if (fs.existsSync(packageJsonPath)) {
        const packageJsonContent = await fs.readFile(packageJsonPath, "utf8")
        const packageJson = JSON.parse(packageJsonContent)
        packageJson.name = path.basename(projectPath)
        await fs.writeFile(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2) + "\n"
        )
      }

      createSpinner?.succeed(`Creating a new Analytics Dashboard project.`)
    } catch (error) {
      createSpinner?.fail(
        `Something went wrong creating a new Analytics Dashboard project.`
      )
      handleError(error)
    }
  },
})
