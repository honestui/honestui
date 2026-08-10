import { existsSync } from "node:fs"
import { copyFile, mkdir, mkdtemp, rm, stat } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

type Snapshot = {
  backupPath?: string
  existed: boolean
  filePath: string
}

export class ProjectMutationJournal {
  private readonly snapshots = new Map<string, Snapshot>()

  private constructor(private readonly backupRoot: string) {}

  static async create() {
    return new ProjectMutationJournal(
      await mkdtemp(path.join(os.tmpdir(), "honestui-mutation-"))
    )
  }

  async capture(filePaths: Iterable<string>) {
    for (const candidate of filePaths) {
      const filePath = path.resolve(candidate)
      if (this.snapshots.has(filePath)) continue

      if (!existsSync(filePath)) {
        this.snapshots.set(filePath, { existed: false, filePath })
        continue
      }

      if (!(await stat(filePath)).isFile()) continue

      const backupPath = path.join(
        this.backupRoot,
        Buffer.from(filePath).toString("base64url")
      )
      await copyFile(filePath, backupPath)
      this.snapshots.set(filePath, { backupPath, existed: true, filePath })
    }
  }

  async rollback() {
    for (const snapshot of Array.from(this.snapshots.values()).reverse()) {
      if (!snapshot.existed) {
        await rm(snapshot.filePath, { force: true })
        continue
      }

      await mkdir(path.dirname(snapshot.filePath), { recursive: true })
      await copyFile(snapshot.backupPath!, snapshot.filePath)
    }
  }

  async dispose() {
    await rm(this.backupRoot, { force: true, recursive: true })
  }
}
