import { createHighlighter } from "./prose-syntax.js"
import type { SyntaxDiagnostic } from "./prose-syntax-shared.js"

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent) => void) | null
  postMessage: (message: unknown) => void
}
const diagnostics: SyntaxDiagnostic[] = []
let highlighter = createHighlighter({ onDiagnostic: diagnostic => diagnostics.push(diagnostic) })
let queue = Promise.resolve()
scope.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    if (data.configure) { highlighter.dispose(); highlighter = createHighlighter({ maxBytes: data.configure.maxBytes, onDiagnostic: diagnostic => diagnostics.push(diagnostic) }); return }
    if (data.release) { highlighter.release(data.release); return }
    const { id, code, language, session } = data
    diagnostics.length = 0
    const result = await highlighter.highlight(code, { language, session })
    scope.postMessage({ id, result, diagnostics: [...diagnostics] })
  }).catch(() => scope.postMessage({ id: data.id, error: true }))
}
