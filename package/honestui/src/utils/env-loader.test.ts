import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it } from "vitest"

import { loadEnvFiles } from "./env-loader"

const ORIGINAL_NODE_ENV = process.env.NODE_ENV
const TEST_KEYS = [
  "HONESTUI_ENV_LOCAL",
  "HONESTUI_ENV_DEVELOPMENT",
  "HONESTUI_ENV_SHARED",
] as const

afterEach(() => {
  for (const key of TEST_KEYS) {
    delete process.env[key]
  }

  if (ORIGINAL_NODE_ENV === undefined) {
    delete process.env.NODE_ENV
  } else {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV
  }
})

describe("loadEnvFiles", () => {
  it("loads supported env files without overwriting earlier values", async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "honestui-env-"))

    await Promise.all([
      fs.writeFile(
        path.join(cwd, ".env.local"),
        "HONESTUI_ENV_LOCAL=local\nHONESTUI_ENV_SHARED=local\n"
      ),
      fs.writeFile(
        path.join(cwd, ".env.development"),
        "HONESTUI_ENV_DEVELOPMENT=development\nHONESTUI_ENV_SHARED=development\n"
      ),
    ])

    await loadEnvFiles(cwd)

    expect(process.env.HONESTUI_ENV_LOCAL).toBe("local")
    expect(process.env.HONESTUI_ENV_DEVELOPMENT).toBe("development")
    expect(process.env.HONESTUI_ENV_SHARED).toBe("local")
  })

  it("preserves values already present in process.env", async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "honestui-env-"))
    process.env.HONESTUI_ENV_SHARED = "existing"
    await fs.writeFile(
      path.join(cwd, ".env.local"),
      "HONESTUI_ENV_SHARED=local\n"
    )

    await loadEnvFiles(cwd)

    expect(process.env.HONESTUI_ENV_SHARED).toBe("existing")
  })
})
