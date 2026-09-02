import path from "path"
import { dashboard } from "@/src/templates/dashboard"
import { templates } from "@/src/templates/index"
import { spinner } from "@/src/utils/spinner"
import { execa } from "execa"
import fs from "fs-extra"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("fs-extra")
vi.mock("execa")
vi.mock("@/src/utils/spinner")
vi.mock("@/src/utils/logger", () => ({
  logger: { break: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

let mockSpinner: Record<string, ReturnType<typeof vi.fn>>

function setupMocks() {
  mockSpinner = {
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  }

  vi.mocked(fs.writeFile).mockResolvedValue(undefined)
  vi.mocked(fs.remove).mockResolvedValue(undefined)
  vi.mocked(fs.existsSync).mockReturnValue(false)
  vi.mocked(fs.copy).mockResolvedValue(undefined)

  vi.mocked(execa).mockResolvedValue({
    stdout: "",
    stderr: "",
    exitCode: 0,
  } as any)

  vi.mocked(spinner).mockReturnValue(mockSpinner as any)
}

describe("dashboard template", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.HONESTUI_DASHBOARD_TEMPLATE_DIR
    delete process.env.HONESTUI_DASHBOARD_URL
    setupMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
    process.env = { ...originalEnv }
  })

  it("is registered as a standalone template", () => {
    expect(templates.dashboard).toBe(dashboard)
    expect(dashboard.standalone).toBe(true)
  })

  it("clones the dashboard repo and strips .git", async () => {
    await dashboard.scaffold({
      projectPath: "/test/my-dashboard",
      packageManager: "npm",
      cwd: "/test",
    })

    expect(vi.mocked(execa)).toHaveBeenCalledWith("git", [
      "clone",
      "--depth",
      "1",
      "https://github.com/honestui/honestui-dashboard.git",
      "/test/my-dashboard",
    ])
    expect(vi.mocked(fs.remove)).toHaveBeenCalledWith(
      path.join("/test/my-dashboard", ".git")
    )
  })

  it("respects the HONESTUI_DASHBOARD_URL override", async () => {
    process.env.HONESTUI_DASHBOARD_URL = "https://example.com/fork.git"

    await dashboard.scaffold({
      projectPath: "/test/my-dashboard",
      packageManager: "npm",
      cwd: "/test",
    })

    expect(vi.mocked(execa)).toHaveBeenCalledWith("git", [
      "clone",
      "--depth",
      "1",
      "https://example.com/fork.git",
      "/test/my-dashboard",
    ])
  })

  it("copies a local checkout when HONESTUI_DASHBOARD_TEMPLATE_DIR is set", async () => {
    process.env.HONESTUI_DASHBOARD_TEMPLATE_DIR = "/local/honestui-dashboard"

    await dashboard.scaffold({
      projectPath: "/test/my-dashboard",
      packageManager: "npm",
      cwd: "/test",
    })

    expect(vi.mocked(fs.copy)).toHaveBeenCalledWith(
      "/local/honestui-dashboard",
      "/test/my-dashboard",
      expect.objectContaining({ filter: expect.any(Function) })
    )
    expect(vi.mocked(execa)).not.toHaveBeenCalledWith(
      "git",
      expect.arrayContaining(["clone"])
    )

    // The filter drops .git, .next, and node_modules but keeps .github.
    const filter = vi.mocked(fs.copy).mock.calls[0][2]!.filter as (
      src: string
    ) => boolean
    expect(filter(path.join("/local/honestui-dashboard", ".git"))).toBe(false)
    expect(filter(path.join("/local/honestui-dashboard", ".next"))).toBe(false)
    expect(
      filter(path.join("/local/honestui-dashboard", "node_modules"))
    ).toBe(false)
    expect(filter(path.join("/local/honestui-dashboard", ".github"))).toBe(
      true
    )
    expect(filter(path.join("/local/honestui-dashboard", "app"))).toBe(true)
  })

  it("keeps the npm lockfile for npm", async () => {
    await dashboard.scaffold({
      projectPath: "/test/my-dashboard",
      packageManager: "npm",
      cwd: "/test",
    })

    expect(vi.mocked(fs.remove)).not.toHaveBeenCalledWith(
      path.join("/test/my-dashboard", "package-lock.json")
    )
    expect(vi.mocked(execa)).toHaveBeenCalledWith("npm", ["install"], {
      cwd: "/test/my-dashboard",
    })
  })

  it("removes the npm lockfile for other package managers", async () => {
    await dashboard.scaffold({
      projectPath: "/test/my-dashboard",
      packageManager: "pnpm",
      cwd: "/test",
    })

    expect(vi.mocked(fs.remove)).toHaveBeenCalledWith(
      path.join("/test/my-dashboard", "package-lock.json")
    )
    expect(vi.mocked(execa)).toHaveBeenCalledWith(
      "pnpm",
      ["install", "--no-frozen-lockfile"],
      { cwd: "/test/my-dashboard" }
    )
  })
})
