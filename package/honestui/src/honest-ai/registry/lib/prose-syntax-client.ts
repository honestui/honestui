import { plainResult } from "./prose-syntax-shared.js"
import type { SyntaxDiagnostic, SyntaxResult } from "./prose-syntax-shared.js"

export type SyntaxClientOptions = {
  workerFactory?: () => Worker
  maxBytes?: number
  timeoutMs?: number
  onDiagnostic?: (diagnostic: SyntaxDiagnostic) => void
}
type Job = { id: number; session: string; code: string; language?: string; resolve: (value: SyntaxResult) => void }

/** One worker and one in-flight request; pending updates coalesce per block. */
export function createSyntaxClient(options: SyntaxClientOptions = {}) {
  let worker: Worker | undefined
  let active: Job | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let sequence = 0
  let disposed = false
  const pending = new Map<string, Job>()
  function finish(result: SyntaxResult) {
    clearTimeout(timer)
    active?.resolve(result)
    active = undefined
    pump()
  }
  function fail(reason: "timeout" | "worker-failed") {
    worker?.terminate()
    worker = undefined
    options.onDiagnostic?.({ reason, language: active?.language })
    if (active) finish(plainResult(active.code))
  }
  function pump() {
    if (active || disposed || !pending.size) return
    active = pending.values().next().value!
    pending.delete(active.session)
    try {
      if (!worker) {
        worker = options.workerFactory?.() ?? new Worker(new URL("./syntax-worker.js", import.meta.url), { type: "module" })
        worker.postMessage({ configure: { maxBytes: options.maxBytes } })
        worker.onmessage = ({ data }) => {
          if (data.id !== active?.id) return
          for (const diagnostic of data.diagnostics ?? []) options.onDiagnostic?.(diagnostic)
          if (data.error) { fail("worker-failed"); return }
          finish(data.result)
        }
        worker.onerror = () => fail("worker-failed")
      }
      const { id, code, language, session } = active
      timer = setTimeout(() => fail("timeout"), options.timeoutMs ?? 1000)
      worker.postMessage({ id, code, language, session })
    } catch { fail("worker-failed") }
  }
  return {
    highlight(code: string, { language, session = "default" }: { language?: string; session?: string } = {}): Promise<SyntaxResult> {
      if (disposed) return Promise.resolve(plainResult(code))
      if (new TextEncoder().encode(code).length > (options.maxBytes ?? 200_000)) {
        options.onDiagnostic?.({ reason: "too-large", language })
        return Promise.resolve(plainResult(code))
      }
      return new Promise(resolve => {
        pending.get(session)?.resolve(plainResult(pending.get(session)!.code))
        pending.set(session, { id: ++sequence, code, language, session, resolve })
        pump()
      })
    },
    release(session: string) {
      const job = pending.get(session)
      if (job) { job.resolve(plainResult(job.code)); pending.delete(session) }
      worker?.postMessage({ release: session })
    },
    dispose() {
      disposed = true
      clearTimeout(timer)
      worker?.terminate()
      active?.resolve(plainResult(active.code))
      active = undefined
      for (const job of pending.values()) job.resolve(plainResult(job.code))
      pending.clear()
    },
  }
}
