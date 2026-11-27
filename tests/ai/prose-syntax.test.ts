import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createHighlighter, languageDisplayName } from "../../registry/honest-ai/lib/prose-syntax"
import { createSyntaxClient } from "../../registry/honest-ai/lib/prose-syntax-client"
import { codeMirrorRoleTags, decodeSemanticTokens, semanticTokenRoles } from "../../registry/honest-ai/lib/prose-syntax-codemirror"
import { Text } from "@codemirror/state"
import { codeToTokens, type ThemeRegistrationRaw } from "shiki"
import { monacoTheme, vscodeTheme } from "../../registry/honest-ai/lib/prose-syntax-themes"
import { syntaxPaletteColors } from "../../registry/honest-ai/lib/prose-syntax-palettes"

const fixtures: Record<string, string> = {
  javascript: 'const message = `hello ${name}`;\n/* multi\nline */\nconsole.log(message)',
  typescript: 'type User = { name: string };\nconst user: User = { name: "Ada" };',
  jsx: 'const view = <div title="Hello">{name}</div>',
  tsx: 'const view = <Button disabled={false}>Save</Button>',
  html: '<style>p { color: red }</style>\n<script>const n = 1</script>',
  css: '.item { color: #fff; --size: 2px; }',
  json: '{"name": "Ada", "active": true}',
  markdown: '# Title\n\n```js\nconst n = 1\n```',
  bash: 'echo "$HOME"\n# comment',
  python: 'def greet(name):\n\treturn f"Hello {name}"',
  sql: "SELECT name FROM users WHERE id = 1;",
  yaml: 'name: Ada\nactive: true\nitems:\n  - one',
}
const text = (result: Awaited<ReturnType<ReturnType<typeof createHighlighter>["highlight"]>>) => result.lines.map(line => line.map(token => token.text).join("")).join("\n")
test("every starter grammar recognizes syntax and preserves source", async () => {
  const highlighter = createHighlighter()
  try {
    for (const [language, code] of Object.entries(fixtures)) {
      const result = await highlighter.highlight(code, { language })
      assert.equal(result.highlighted, true, language)
      assert.equal(text(result), code)
      assert.ok(result.lines.flat().some(token => token.role !== "plain"), language)
    }
    for (const language of ["js", "ts", "sh", "py", "yml", "md"]) assert.equal((await highlighter.highlight("name", { language })).highlighted, true)
  } finally { highlighter.dispose() }
})
test("streaming is equivalent to a whole block, including edits and incomplete constructs", async () => {
  const highlighter = createHighlighter()
  try {
    for (const [language, source] of Object.entries(fixtures)) {
      for (let end = 1; end <= source.length; end += 3) {
        const code = source.slice(0, end)
        assert.deepEqual(await highlighter.highlight(code, { language, session: language }), await highlighter.highlight(code, { language }), `${language}:${end}`)
      }
      const edited = `\n${source}\n`
      assert.deepEqual(await highlighter.highlight(edited, { language, session: language }), await highlighter.highlight(edited, { language }))
    }
    for (const code of ['', '\t雪 😀\r\n\r\n', '/* one\ntwo\nthree */\nconst a = "', 'const n = 1\n']) assert.equal(text(await highlighter.highlight(code, { language: "js" })), code)
  } finally { highlighter.dispose() }
})
test("unknown, failed, oversized inputs stay plain; HTML is escaped", async () => {
  const reasons: string[] = []
  const highlighter = createHighlighter({ maxBytes: 100, languages: { broken: async () => { throw new Error("private source") } }, onDiagnostic: event => reasons.push(event.reason) })
  try {
    for (const language of [undefined, "constructor", "https://bad.example/grammar", "broken"]) assert.equal((await highlighter.highlight('<script>alert(1)</script>', { language })).highlighted, false)
    assert.equal((await highlighter.highlight("雪".repeat(40), { language: "js" })).highlighted, false)
    const html = await highlighter.toHtml('<img src=x onerror="bad()">', { language: "html" })
    assert.ok(!html.includes("<img"))
    assert.ok(html.includes("&lt;"))
    assert.ok(reasons.includes("load-failed") && reasons.includes("too-large"))
  } finally { highlighter.dispose() }
  await assert.rejects(highlighter.highlight("x"), /disposed/)
})
test("worker requests coalesce, time out, and resolve on disposal", async () => {
  let terminated = 0
  const worker = { postMessage() {}, terminate() { terminated++ }, onmessage: null, onerror: null } as unknown as Worker
  const client = createSyntaxClient({ workerFactory: () => worker, timeoutMs: 10 })
  const first = client.highlight("a", { session: "a" })
  const replaced = client.highlight("b", { session: "a" })
  const last = client.highlight("c", { session: "a" })
  assert.equal(text(await replaced), "b")
  assert.equal(text(await first), "a")
  assert.ok(terminated > 0)
  client.dispose()
  assert.equal(text(await last), "c")
})
test("every palette meets 4.5:1 and keeps key tokens distinct from plain text", () => {
  const css = readFileSync("registry/honest-ai/styles/prose-syntax-theme.css", "utf8")
  const linear = (value: number) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  const channels = (hex: string) => hex.match(/\w\w/g)!.map(value => linear(parseInt(value, 16) / 255))
  const luminance = (hex: string) => channels(hex).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
  const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05)
  const oklab = (hex: string) => {
    const [r, g, b] = channels(hex)
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
  }
  const distance = (a: string, b: string) => Math.hypot(...oklab(a).map((value, index) => value - oklab(b)[index]))

  // Surfaces per mode, and the default palette from each role's fallback.
  const surfaces: Record<string, string[]> = {}
  const palettes: Record<string, Record<string, Record<string, string>>> = { default: { light: {}, dark: {} } }
  for (const rule of css.matchAll(/\{([^{}]+)\}/g)) {
    const background = /--_syntax-background: #([\da-f]{6})/.exec(rule[1])?.[1]
    const highlight = /--_syntax-highlight: #([\da-f]{6})/.exec(rule[1])?.[1]
    for (const role of rule[1].matchAll(/--_syntax-(\w+): var\(--_syntax-palette-\w+-(light|dark), #([\da-f]{6})\)/g)) {
      palettes.default[role[2]][role[1]] = role[3]
      if (background && highlight) surfaces[role[2]] = [background, highlight]
    }
  }
  for (const rule of css.matchAll(/data-syntax-palette="(\w+)"\] \{([^{}]+)\}/g)) {
    palettes[rule[1]] = { light: {}, dark: {} }
    for (const role of rule[2].matchAll(/--_syntax-palette-(\w+)-(light|dark): #([\da-f]{6})/g)) palettes[rule[1]][role[2]][role[1]] = role[3]
  }

  // Guard against a regex that silently matches nothing.
  assert.deepEqual(Object.keys(palettes).sort(), ["default", "graphite", "violet"])
  assert.deepEqual(Object.keys(surfaces).sort(), ["dark", "light"])
  for (const [name, modes] of Object.entries(palettes)) {
    for (const [mode, roles] of Object.entries(modes)) {
      assert.equal(Object.keys(roles).length, 14, `${name} ${mode} roles`)
      for (const [role, color] of Object.entries(roles)) {
        for (const surface of surfaces[mode]) assert.ok(contrast(color, surface) >= 4.5, `${name} ${mode} ${role} on #${surface}`)
      }
      // Highlighting has to show: these roles must not read as plain text.
      for (const role of ["keyword", "string", "comment"]) {
        assert.ok(distance(roles[role], roles.plain) >= 0.1, `${name} ${mode} ${role} is too close to plain text`)
      }
    }
  }
})

test("every CodeMirror role has a stylesheet rule, and no tag takes two roles", () => {
  const css = readFileSync("registry/honest-ai/styles/prose-syntax-theme.css", "utf8")
  const seen = new Map<unknown, string>()
  for (const [role, tagList] of Object.entries(codeMirrorRoleTags)) {
    assert.ok(css.includes(`.honest-syntax .prose-syntax-${role} {`), `${role} has no class rule`)
    assert.ok(tagList.length > 0, role)
    for (const tag of tagList) {
      assert.ok(!seen.has(tag), `a tag is mapped to both ${seen.get(tag)} and ${role}`)
      seen.set(tag, role)
    }
  }
})

test("every semantic token role has a stylesheet rule", () => {
  const css = readFileSync("registry/honest-ai/styles/prose-syntax-theme.css", "utf8")
  for (const role of new Set(Object.values(semanticTokenRoles))) assert.ok(css.includes(`.honest-syntax .prose-syntax-${role} {`), role)
  assert.ok(css.includes(".honest-syntax .prose-syntax-deprecated {"))
})

test("decodes Language Server semantic tokens into document positions", () => {
  const doc = Text.of(["function f(a, b) {", "  return a + b", "}"])
  const legend = { tokenTypes: ["function", "parameter", "variable"], tokenModifiers: ["declaration", "deprecated"] }
  // f, a (declaration), b (declaration); then a and b on the next line, b deprecated.
  const data = [0, 9, 1, 0, 1, 0, 2, 1, 1, 1, 0, 3, 1, 1, 1, 1, 9, 1, 1, 0, 0, 4, 1, 1, 2]
  assert.deepEqual(decodeSemanticTokens(data, legend, doc), [
    { from: 9, to: 10, type: "function", modifiers: ["declaration"] },
    { from: 11, to: 12, type: "parameter", modifiers: ["declaration"] },
    { from: 14, to: 15, type: "parameter", modifiers: ["declaration"] },
    { from: 28, to: 29, type: "parameter", modifiers: [] },
    { from: 32, to: 33, type: "parameter", modifiers: ["deprecated"] },
  ])
  // Unknown type indexes, empty tokens, and lines past the end are dropped; tokens are clipped to their line.
  assert.deepEqual(decodeSemanticTokens([0, 0, 0, 0, 0, 0, 0, 99, 9, 0, 0, 1, 500, 2, 0, 9, 0, 1, 0, 0], legend, doc), [
    { from: 1, to: 18, type: "variable", modifiers: [] },
  ])
})

test("the VS Code theme colors real TextMate scopes, including parameters", async () => {
  for (const palette of ["violet", "graphite"] as const) {
    for (const mode of ["light", "dark"] as const) {
      const colors = syntaxPaletteColors[palette][mode]
      const theme = vscodeTheme(palette, mode)
      // Shiki loads VS Code theme JSON as is; its own type is stricter than the format.
      const { tokens } = await codeToTokens("// note\nfunction greet(name: string) { return name + 1 }", { lang: "typescript", theme: theme as unknown as ThemeRegistrationRaw })
      const color = (text: string) => tokens.flat().find(token => token.content.trim() === text)?.color?.toLowerCase()
      assert.equal(color("note"), colors.comment, `${palette} ${mode} comment`)
      assert.equal(color("function"), colors.keyword, `${palette} ${mode} keyword`)
      assert.equal(color("greet"), colors.function, `${palette} ${mode} function`)
      assert.equal(color("string"), colors.type, `${palette} ${mode} type`)
      assert.equal(color("1"), colors.constant, `${palette} ${mode} number`)
      assert.equal(color("+"), colors.operator, `${palette} ${mode} operator`)
      // TextMate marks the declaration as a parameter; uses need semantic tokens.
      const parameter = tokens.flat().find(token => token.content === "name")
      assert.equal(parameter?.color?.toLowerCase(), colors.parameter, `${palette} ${mode} parameter`)
      assert.deepEqual(theme.semanticTokenColors.parameter, { foreground: colors.parameter, italic: true })
      assert.deepEqual(theme.semanticTokenColors["*.deprecated"], { strikethrough: true })
    }
  }
})

test("the Monaco theme uses literal, valid colors for every rule", () => {
  for (const palette of ["violet", "graphite"] as const) {
    for (const mode of ["light", "dark"] as const) {
      const theme = monacoTheme(palette, mode)
      assert.equal(theme.base, mode === "light" ? "vs" : "vs-dark")
      for (const rule of theme.rules) assert.match(rule.foreground, /^[\da-f]{6}$/, rule.token)
      for (const [key, value] of Object.entries(theme.colors)) assert.match(value, /^#[\da-f]{6}([\da-f]{2})?$/, key)
      assert.equal(theme.rules.find(rule => rule.token === "parameter")?.foreground, syntaxPaletteColors[palette][mode].parameter.slice(1))
    }
  }
})

test("common chat languages and their aliases highlight", async () => {
  const highlighter = createHighlighter()
  try {
    const samples: Record<string, [string, string]> = {
      java: ["for (int i = 0; i < 5; i++) {}", "for"],
      "c++": ["int main() { return 0; }", "return"],
      cs: ["public class A {}", "public"],
      golang: ["func main() {}", "func"],
      rs: ["fn main() {}", "fn"],
      rb: ["def greet; end", "def"],
      kt: ["fun main() {}", "fun"],
      swift: ["let x = 1", "let"],
      php: ["<?php function f() {} ?>", "function"],
      c: ["return 0;", "return"],
    }
    for (const [language, [code, keyword]] of Object.entries(samples)) {
      const result = await highlighter.highlight(code, { language })
      assert.ok(result.highlighted, `${language} highlighted`)
      const roles = result.lines.flat().filter(token => token.text.trim() === keyword).map(token => token.role)
      assert.ok(roles.includes("keyword"), `${language}: ${keyword} is ${roles.join(", ") || "missing"}`)
    }
  } finally {
    highlighter.dispose()
  }
})

test("languages show as people write them; unknown ones stay as written", () => {
  const expected: Record<string, string> = {
    java: "Java", JAVA: "Java", cpp: "C++", "c++": "C++", cs: "C#", ts: "TypeScript", tsx: "TSX", js: "JavaScript",
    py: "Python", golang: "Go", rs: "Rust", sh: "Shell", zsh: "Zsh", bash: "Bash", yml: "YAML", json: "JSON", " sql ": "SQL",
    elixir: "elixir", constructor: "constructor",
  }
  for (const [input, name] of Object.entries(expected)) assert.equal(languageDisplayName(input), name, input)
})

test("multiline lexical context survives append and language changes", async () => {
  const highlighter = createHighlighter()
  try {
    await highlighter.highlight("/* start\n", { language: "js", session: "block" })
    const comment = await highlighter.highlight("/* start\nstill comment", { language: "js", session: "block" })
    assert.ok(comment.lines[1].every(token => token.role === "comment"))
    const closed = await highlighter.highlight("/* start\nend */\nconst n = 1", { language: "js", session: "block" })
    assert.ok(closed.lines[2].some(token => token.role === "keyword"))
    assert.equal(text(await highlighter.highlight('name: true', { language: 'yaml', session: 'block' })), 'name: true')
  } finally { highlighter.dispose() }
})

test("a worker error preserves each concurrent block and disposal prevents new jobs", async () => {
  let worker: Worker
  const client = createSyntaxClient({ workerFactory: () => worker = { postMessage() {}, terminate() {}, onmessage: null, onerror: null } as unknown as Worker })
  const first = client.highlight("first", { session: "one" })
  const second = client.highlight("second", { session: "two" })
  worker!.onerror!({} as ErrorEvent)
  assert.equal(text(await first), "first")
  client.dispose()
  assert.equal(text(await second), "second")
  assert.equal(text(await client.highlight("after disposal")), "after disposal")
})
