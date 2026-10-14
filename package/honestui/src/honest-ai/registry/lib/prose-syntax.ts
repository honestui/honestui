import { createHighlighterCore } from "shiki/core"
import { createOnigurumaEngine } from "shiki/engine/oniguruma"
import type { GrammarState, HighlighterCore, LanguageInput } from "shiki/core"

import { syntaxRoles, syntaxRoleScopes, normalizeLanguage, plainResult, renderTokens } from "./prose-syntax-shared.js"
import type { SyntaxToken, SyntaxResult, SyntaxOptions, SyntaxDiagnostic } from "./prose-syntax-shared.js"
export * from "./prose-syntax-shared.js"
export type HighlighterOptions = {
  languages?: Record<string, () => Promise<LanguageInput>>
  maxBytes?: number
  onDiagnostic?: (diagnostic: SyntaxDiagnostic) => void
}

export const languageLoaders = {
  javascript: () => import("shiki/langs/javascript.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  bash: () => import("shiki/langs/bash.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  csharp: () => import("shiki/langs/csharp.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  php: () => import("shiki/langs/php.mjs"),
  ruby: () => import("shiki/langs/ruby.mjs"),
  kotlin: () => import("shiki/langs/kotlin.mjs"),
  swift: () => import("shiki/langs/swift.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  dockerfile: () => import("shiki/langs/dockerfile.mjs"),
}
// Unique sentinel colors encode roles; actual colors belong exclusively to CSS.
const scopes = syntaxRoles.map(role => syntaxRoleScopes[role])
const roleColors = syntaxRoles.map((_, index) => `#0000${(index + 1).toString(16).padStart(2, "0")}`)
const theme = { name: "honest-roles", colors: { "editor.foreground": roleColors[0], "editor.background": "#ffffff" }, settings: scopes.map((scope, index) => ({ scope, settings: { foreground: roleColors[index], fontStyle: "" } })) }

export function createHighlighter(options: HighlighterOptions = {}) {
  const loaders = { ...languageLoaders, ...options.languages } as Record<string, () => Promise<LanguageInput>>
  let instance: Promise<HighlighterCore> | undefined
  let disposed = false
  const loading = new Map<string, Promise<void>>()
  const sessions = new Map<string, { language: string; prefix: string; lines: SyntaxToken[][]; state?: GrammarState }>()
  const diagnostic = (reason: SyntaxDiagnostic["reason"], language: string) => options.onDiagnostic?.({ reason, language })
  async function highlight(code: string, { language: input, session }: SyntaxOptions = {}): Promise<SyntaxResult> {
    if (disposed) throw new Error("Highlighter has been disposed.")
    const language = normalizeLanguage(input)
    if (new TextEncoder().encode(code).length > (options.maxBytes ?? 200_000)) { diagnostic("too-large", language); return plainResult(code) }
    if (language === "plaintext" || !language) return plainResult(code)
    if (!Object.hasOwn(loaders, language)) { diagnostic("unknown-language", language); return plainResult(code) }
    try {
      instance ??= createHighlighterCore({ themes: [theme], langs: [], engine: createOnigurumaEngine(import("shiki/wasm")) }).catch(error => { instance = undefined; throw error })
      const highlighter = await instance
      if (disposed) return plainResult(code)
      if (!loading.has(language)) {
        const promise = loaders[language]().then(grammar => highlighter.loadLanguage(grammar))
        loading.set(language, promise)
        promise.catch(() => loading.delete(language))
      }
      await loading.get(language)
      if (disposed) return plainResult(code)
      const previous = session ? sessions.get(session) : undefined
      const reusable = previous?.language === language && code.startsWith(previous.prefix) ? previous : undefined
      const prefixLength = reusable?.prefix.length ?? 0
      const split = code.lastIndexOf("\n") + 1
      const convert = (text: string, grammarState?: GrammarState) => {
        const tokens = highlighter.codeToTokensBase(text, { lang: language, theme: "honest-roles", grammarState })
        // Shiki normalizes CRLF. Restore carriage returns so text round-trips exactly.
        const sourceLines = text.split("\n")
        const lines = tokens.map((line, index) => {
          const converted: SyntaxToken[] = line.map(token => ({ text: token.content, role: syntaxRoles[Math.max(0, roleColors.indexOf(token.color ?? ""))] }))
          if (sourceLines[index]?.endsWith("\r") && !converted.map(t => t.text).join("").endsWith("\r")) converted.push({ text: "\r", role: "plain" })
          return converted
        })
        return { lines, state: highlighter.getLastGrammarState(tokens) }
      }
      const complete = split > prefixLength ? convert(code.slice(prefixLength, split), reusable?.state) : undefined
      const lines = [...(reusable?.lines ?? []), ...(complete?.lines.slice(0, -1) ?? [])]
      const state = complete?.state ?? reusable?.state
      const tail = convert(code.slice(split), state)
      if (session) {
        sessions.delete(session)
        sessions.set(session, { language, prefix: code.slice(0, split), lines, state })
        if (sessions.size > 32) sessions.delete(sessions.keys().next().value!)
      }
      const result = { lines: [...lines, ...tail.lines], highlighted: true }
      // A grammar must never be allowed to alter source text.
      if (result.lines.map(line => line.map(t => t.text).join("")).join("\n") !== code) return plainResult(code)
      return result
    } catch {
      diagnostic("load-failed", language)
      return plainResult(code)
    }
  }
  return {
    highlight,
    async toHtml(code: string, options?: SyntaxOptions) {
      return `<pre class="honest-syntax" tabindex="0" aria-label="Code"><code>${renderTokens(await highlight(code, options))}</code></pre>`
    },
    release(session: string) { sessions.delete(session) },
    dispose() { disposed = true; sessions.clear(); loading.clear(); void instance?.then(value => value.dispose()).catch(() => undefined) },
  }
}
