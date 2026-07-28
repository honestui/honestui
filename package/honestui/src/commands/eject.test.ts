import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises"
import os from "os"
import path from "path"
import {
  formatMonorepoMessage,
  getMonorepoTargets,
  isMonorepoRoot,
} from "@/src/utils/get-monorepo-info"
import { getPackageManager } from "@/src/utils/get-package-manager"
import { execa } from "execa"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { runEject, HONESTUI_TAILWIND_IMPORT } from "./eject"

vi.mock("execa", () => ({
  execa: vi.fn(),
}))

vi.mock("@/src/utils/get-package-manager", () => ({
  getPackageManager: vi.fn().mockResolvedValue("pnpm"),
}))

vi.mock("@/src/utils/get-monorepo-info", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/src/utils/get-monorepo-info")>()
  return {
    ...actual,
    formatMonorepoMessage: vi.fn(),
    getMonorepoTargets: vi.fn().mockResolvedValue([]),
    isMonorepoRoot: vi.fn().mockResolvedValue(false),
  }
})

vi.mock("@/src/utils/spinner", () => ({
  spinner: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn(),
  })),
}))

vi.mock("@/src/utils/logger", () => ({
  logger: {
    break: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
  },
}))

const fixtureConfig = {
  $schema: "https://honestui.com/schema.json",
  style: "base-default",
  rsc: true,
  tsx: true,
  tailwind: {
    config: "",
    css: "app/globals.css",
    baseColor: "neutral",
    cssVariables: true,
  },
  aliases: {
    components: "@/components",
    utils: "@/lib/utils",
    ui: "@/components/ui",
    lib: "@/lib",
    hooks: "@/hooks",
  },
}

const fixtureTsconfig = {
  compilerOptions: {
    baseUrl: ".",
    paths: {
      "@/*": ["./*"],
    },
  },
}

const baseCss = `@import "tailwindcss";
@import "tw-animate-css";
@import "honestui/tailwind.css";

@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
`

describe("runEject", () => {
  let tempDir: string

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(getPackageManager).mockResolvedValue("pnpm")
    tempDir = await mkdtemp(path.join(os.tmpdir(), "honestui-eject-"))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  async function setupProject(
    cssContent: string,
    packageJson: Record<string, unknown> = {
      name: "test-app",
      dependencies: {
        "honestui": "^4.8.3",
      },
    }
  ) {
    await writeFile(
      path.join(tempDir, "components.json"),
      JSON.stringify(fixtureConfig, null, 2)
    )
    await writeFile(
      path.join(tempDir, "tsconfig.json"),
      JSON.stringify(fixtureTsconfig, null, 2)
    )
    await mkdir(path.join(tempDir, "app"), { recursive: true })
    await writeFile(path.join(tempDir, "app", "globals.css"), cssContent)
    await writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    )
  }

  it("inlines honestui/tailwind.css and removes the dependency", async () => {
    await setupProject(baseCss)

    await runEject({
      cwd: tempDir,
      yes: true,
      silent: true,
    })

    const output = await readFile(
      path.join(tempDir, "app", "globals.css"),
      "utf8"
    )
    const honestUiCss = await readFile(
      path.join(process.cwd(), "src/tailwind.css"),
      "utf8"
    )

    expect(output).not.toMatch(HONESTUI_TAILWIND_IMPORT)
    expect(output).toContain('@import "tailwindcss";')
    expect(output).toContain('@import "tw-animate-css";')
    expect(output).toContain("/* ejected from honestui@4.8.3 */")
    expect(output).toContain(honestUiCss.trim())
    expect(output).toContain("@layer base")
    expect(output).toContain("@apply bg-background text-foreground;")
    expect(execa).toHaveBeenCalledWith("pnpm", ["remove", "honestui"], {
      cwd: tempDir,
    })
  })

  it("removes honestui from devDependencies", async () => {
    await setupProject(baseCss, {
      name: "test-app",
      devDependencies: {
        "honestui": "^4.8.3",
      },
    })

    await runEject({
      cwd: tempDir,
      yes: true,
      silent: true,
    })

    const output = await readFile(
      path.join(tempDir, "app", "globals.css"),
      "utf8"
    )

    expect(output).toContain("/* ejected from honestui@4.8.3 */")
    expect(execa).toHaveBeenCalledWith("pnpm", ["remove", "honestui"], {
      cwd: tempDir,
    })
  })

  it("skips dependency removal when honestui is not in package.json", async () => {
    await setupProject(baseCss, {
      name: "test-app",
      dependencies: {},
    })

    await runEject({
      cwd: tempDir,
      yes: true,
      silent: true,
    })

    expect(execa).not.toHaveBeenCalled()
  })

  it("removes honestui from package.json for deno", async () => {
    vi.mocked(getPackageManager).mockResolvedValue("deno")
    await setupProject(baseCss)

    await runEject({
      cwd: tempDir,
      yes: true,
      silent: true,
    })

    const packageJson = JSON.parse(
      await readFile(path.join(tempDir, "package.json"), "utf8")
    )

    expect(packageJson.dependencies?.["honestui"]).toBeUndefined()
    expect(execa).not.toHaveBeenCalled()
  })

  it("exits when honestui/tailwind.css is not imported", async () => {
    await setupProject(`@import "tailwindcss";
@import "tw-animate-css";
`)

    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit")
    }) as never)

    await expect(
      runEject({
        cwd: tempDir,
        yes: true,
        silent: true,
      })
    ).rejects.toThrow("process.exit")

    exit.mockRestore()
  })

  it("shows monorepo suggestions when run from a monorepo root", async () => {
    vi.mocked(isMonorepoRoot).mockResolvedValue(true)
    vi.mocked(getMonorepoTargets).mockResolvedValue([
      { name: "packages/ui", hasConfig: true },
      { name: "apps/web", hasConfig: true },
    ])

    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit")
    }) as never)

    await expect(
      runEject({
        cwd: tempDir,
        yes: true,
        silent: true,
      })
    ).rejects.toThrow("process.exit")

    expect(formatMonorepoMessage).toHaveBeenCalledWith("eject", [
      { name: "packages/ui", hasConfig: true },
      { name: "apps/web", hasConfig: true },
    ])

    exit.mockRestore()
  })
})
