import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { ProjectMutationJournal } from "./project-mutation-journal"

let fixtureRoot: string | undefined

afterEach(async () => {
  if (fixtureRoot) await rm(fixtureRoot, { force: true, recursive: true })
})

describe("ProjectMutationJournal", () => {
  it("restores changed files and removes files created by a failed operation", async () => {
    fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "honestui-journal-test-"))
    const existingPath = path.join(fixtureRoot, "existing.ts")
    const newPath = path.join(fixtureRoot, "new.ts")
    await writeFile(existingPath, "before", "utf8")

    const journal = await ProjectMutationJournal.create()
    await journal.capture([existingPath, newPath])
    await writeFile(existingPath, "after", "utf8")
    await writeFile(newPath, "created", "utf8")

    await journal.rollback()
    await journal.dispose()

    expect(await readFile(existingPath, "utf8")).toBe("before")
    expect(existsSync(newPath)).toBe(false)
  })
})
