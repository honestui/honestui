import { createSyntaxClient } from "./prose-syntax-client.js"
import type { SyntaxClientOptions } from "./prose-syntax-client.js"

export function createBrowserHighlighter(options?: SyntaxClientOptions) {
  const client = createSyntaxClient(options)
  const sessions = new WeakMap<HTMLElement, string>()
  const versions = new WeakMap<HTMLElement, number>()
  let sequence = 0
  async function highlightElement(element: HTMLElement) {
    const code = element.matches("code") ? element : element.querySelector("code")
    if (!(code instanceof HTMLElement)) return
    const source = code.textContent ?? ""
    const version = ++sequence
    versions.set(code, version)
    const language = code.dataset.language ?? /(?:^|\s)language-(\S+)/.exec(code.className)?.[1]
    const session = sessions.get(code) ?? `element-${version}`
    sessions.set(code, session)
    const result = await client.highlight(source, { language, session })
    if (versions.get(code) !== version || code.textContent !== source) return
    // Do not destroy an active selection to apply an optional enhancement.
    const selection = code.ownerDocument.getSelection()
    if (selection && !selection.isCollapsed && selection.containsNode(code, true)) return
    const fragment = document.createDocumentFragment()
    result.lines.forEach((line, index) => {
      if (index) fragment.append(document.createTextNode("\n"))
      for (const token of line) {
        const span = document.createElement("span")
        span.className = `prose-syntax-${token.role}`
        span.textContent = token.text
        fragment.append(span)
      }
    })
    code.replaceChildren(fragment)
    const pre = code.closest("pre")
    if (pre) { pre.classList.add("honest-syntax"); if (!pre.hasAttribute("tabindex")) pre.tabIndex = 0; if (!pre.hasAttribute("aria-label")) pre.setAttribute("aria-label", "Code") }
  }
  return {
    highlightElement,
    async highlightAll(root: ParentNode = document) { await Promise.all(Array.from(root.querySelectorAll<HTMLElement>("pre[data-honest-syntax] > code")).map(highlightElement)) },
    dispose: client.dispose,
  }
}
let defaultHighlighter: ReturnType<typeof createBrowserHighlighter> | undefined
export function highlightElement(element: HTMLElement) { return (defaultHighlighter ??= createBrowserHighlighter()).highlightElement(element) }
export function highlightAll(root: ParentNode = document) { return (defaultHighlighter ??= createBrowserHighlighter()).highlightAll(root) }
export function dispose() { defaultHighlighter?.dispose(); defaultHighlighter = undefined }
