export type SyntaxPalette = "violet" | "graphite"
export const syntaxRoles = ["plain", "comment", "keyword", "string", "constant", "function", "type", "property", "tag", "punctuation"] as const
export type SyntaxRole = (typeof syntaxRoles)[number]
/** Roles an editor needs beyond reading: names, parameters, operators, and code that does not parse. */
export type EditorSyntaxRole = SyntaxRole | "variable" | "parameter" | "operator" | "invalid"
/** Language Server Protocol token types, by role. Unlisted types keep the grammar's color. */
export const semanticTokenRoles: Record<string, EditorSyntaxRole> = {
  namespace: "type", type: "type", class: "type", enum: "type", interface: "type", struct: "type", typeParameter: "type",
  parameter: "parameter", variable: "variable", property: "property", enumMember: "constant", event: "property",
  function: "function", method: "function", macro: "function", decorator: "function",
  keyword: "keyword", modifier: "keyword", comment: "comment", string: "string", number: "constant", regexp: "string", operator: "operator",
}
/** The TextMate scopes each role colors. Shared by the Shiki engine and the VS Code theme. */
export const syntaxRoleScopes: Record<SyntaxRole, string[]> = {
  plain: [],
  comment: ["comment"],
  keyword: ["keyword", "storage"],
  string: ["string"],
  constant: ["constant"],
  function: ["entity.name.function", "support.function"],
  type: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
  property: ["variable.other.property", "support.type.property-name", "entity.other.attribute-name"],
  tag: ["entity.name.tag"],
  punctuation: ["punctuation"],
}
export type SyntaxToken = { text: string; role: SyntaxRole }
export type SyntaxResult = { lines: SyntaxToken[][]; highlighted: boolean }
export type SyntaxDiagnostic = { reason: "unknown-language" | "load-failed" | "too-large" | "timeout" | "worker-failed"; language?: string }
export type SyntaxOptions = { language?: string; session?: string }

// Short names people write in fences, and the grammar each one means.
const aliases: Record<string, string> = { js: "javascript", ts: "typescript", sh: "bash", shell: "bash", zsh: "bash", py: "python", yml: "yaml", md: "markdown", text: "plaintext", txt: "plaintext", "c++": "cpp", cc: "cpp", h: "c", hpp: "cpp", cs: "csharp", "c#": "csharp", golang: "go", rs: "rust", rb: "ruby", kt: "kotlin", kts: "kotlin", patch: "diff", docker: "dockerfile" }
export function normalizeLanguage(language = "plaintext") {
  const value = language.trim().toLowerCase()
  return Object.hasOwn(aliases, value) ? aliases[value] : value
}

// How people write each language's name. Shell aliases keep their own name, since `zsh` is not Bash.
const displayNames: Record<string, string> = {
  javascript: "JavaScript", typescript: "TypeScript", jsx: "JSX", tsx: "TSX", html: "HTML", css: "CSS", json: "JSON",
  markdown: "Markdown", bash: "Bash", sh: "Shell", shell: "Shell", zsh: "Zsh", python: "Python", sql: "SQL", yaml: "YAML",
  java: "Java", c: "C", cpp: "C++", csharp: "C#", go: "Go", rust: "Rust", php: "PHP", ruby: "Ruby", kotlin: "Kotlin",
  swift: "Swift", diff: "Diff", toml: "TOML", dockerfile: "Dockerfile", plaintext: "Text",
}

/** A fence's language as people write it, such as "C++" for `cpp`. Unknown languages are returned as written. */
export function languageDisplayName(language: string) {
  const value = language.trim().toLowerCase()
  if (Object.hasOwn(displayNames, value)) return displayNames[value]
  const canonical = normalizeLanguage(value)
  return Object.hasOwn(displayNames, canonical) ? displayNames[canonical] : language.trim()
}

export function plainResult(code: string): SyntaxResult {
  return { lines: code.split("\n").map(text => [{ text, role: "plain" }]), highlighted: false }
}
export function escapeHtml(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;")
}
export function renderTokens(result: SyntaxResult) {
  return result.lines.map(line => line.map(token => `<span class="prose-syntax-${token.role}">${escapeHtml(token.text)}</span>`).join("")).join("\n")
}

