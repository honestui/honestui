import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { test } from "node:test"
import { expect } from "@playwright/test"

import { Markdown } from "@/registry/honest-ai/ai/markdown"
import { repairMarkdown } from "@/registry/honest-ai/lib/repair-markdown"
import { mathPlugins, normalizeMathDelimiters } from "@/registry/honest-ai/lib/markdown-math"

test("Markdown holds component data until a matching closing fence arrives", () => {
  const bodies: string[] = []
  const blocks = { widget: (body: string) => { bodies.push(body); return <aside>Ready</aside> } }
  for (const source of ["````widget\n{}", "````widget\n{}\n```", "```widget\n{}\n~~~", "> ```widget\n> {}", "- ```widget\n  {}"] ) {
    const html = renderToStaticMarkup(<Markdown isStreaming blocks={blocks}>{source}</Markdown>)
    expect(html).toContain('data-slot="markdown-block-pending"')
  }
  expect(bodies).toEqual([])
  const html = renderToStaticMarkup(<Markdown isStreaming blocks={blocks}>{"````widget\n{}\n`````"}</Markdown>)
  expect(html).toContain("<aside>Ready</aside>")
  expect(bodies).toEqual(["{}"])
})

test("Markdown preserves invalid component data as code and ignores inherited renderers", () => {
  const blocks = { widget: () => { throw new Error("Invalid data") } }
  const html = renderToStaticMarkup(<Markdown blocks={blocks}>{"```widget\ninvalid\n```"}</Markdown>)
  expect(html).toContain('data-slot="prose-code-block"')
  expect(html).toContain("invalid")
  const inherited = renderToStaticMarkup(<Markdown blocks={blocks}>{"```constructor\n{}\n```"}</Markdown>)
  expect(inherited).toContain('data-slot="prose-code-block"')
})

test("Markdown names a code block by its language as people write it", () => {
  const html = renderToStaticMarkup(<Markdown>{"```cpp\nint main() {}\n```\n\n```elixir\nIO.puts 1\n```"}</Markdown>)
  expect(html).toContain(">C++<")
  expect(html).toContain(">elixir<")
})

test("Markdown passes filename metadata, the full code, and line indices to adapters", () => {
  const lines: unknown[] = []
  const actions: unknown[] = []
  const html = renderToStaticMarkup(
    <Markdown
      renderCodeLine={(text, language, line) => { lines.push({ text, language, ...line }); return text }}
      renderCodeActions={(block) => { actions.push(block); return <button>Open</button> }}
    >{"```ts title=\"export.ts\"\nconst a = 1\nconst b = 2\n```"}</Markdown>
  )
  expect(html).toContain("export.ts")
  // A title is a file name, so it is not renamed after its language.
  expect(html).not.toContain(">TypeScript<")
  expect(html).toContain("<button>Open</button>")
  expect(actions).toEqual([{ code: "const a = 1\nconst b = 2", language: "ts", title: "export.ts" }])
  expect(lines).toEqual([
    { text: "const a = 1", language: "ts", index: 0, code: "const a = 1\nconst b = 2" },
    { text: "const b = 2", language: "ts", index: 1, code: "const a = 1\nconst b = 2" },
  ])
})

test("Markdown leaves HTML inert and unsafe URLs unclickable", () => {
  const html = renderToStaticMarkup(<Markdown>{'<script>alert(1)</script>\n\n[bad](javascript:alert%281%29)\n\n![private](https://example.com/image)'}</Markdown>)
  expect(html).not.toContain("<script>")
  expect(html).not.toContain("javascript:")
  expect(html).not.toContain("<img")
  expect(html).toContain('href="https://example.com/image"')
})

test("standalone repair preserves code and complete content while closing partial inline syntax", () => {
  for (const source of ["Finished **bold**.", "snake_case", "```ts\nconst x = '**'", "A paragraph.\n\n"]) {
    expect(repairMarkdown(source)).toBe(source)
  }
  expect(repairMarkdown("Finished.\n\nAn **open")).toBe("Finished.\n\nAn **open**")
  expect(repairMarkdown("see [docs](https://exa")).toBe("see docs")
  expect(repairMarkdown("use `npm ru")).toBe("use `npm ru`")
})

test("math normalizes delimiters without rewriting code or interpreting prices", () => {
  expect(normalizeMathDelimiters(String.raw`Use \(x\) and $5.`)).toBe("Use $$x$$ and $5.")
  expect(normalizeMathDelimiters(String.raw`\[
x + y
\]`)).toBe("$$\nx + y\n$$")
  expect(normalizeMathDelimiters("> \\[\n> x + y\n> \\]")).toBe("> $$\n> x + y\n> $$")
  expect(normalizeMathDelimiters("\\[x\\]")).toBe("$$\nx\n$$")
  expect(normalizeMathDelimiters("````tex\n\\(x\\)\n`````\n\\(y\\)")).toBe("````tex\n\\(x\\)\n`````\n$$y$$")
  for (const source of [String.raw`Use \(unfinished`, "`\\(x\\)`", "`` ` \\(x\\) ``", "```tex\n\\(x\\)\n```", "~~~~tex\n\\(x\\)\n~~~\n\\(y\\)"]) {
    expect(normalizeMathDelimiters(source)).toBe(source)
  }
  const html = renderToStaticMarkup(<Markdown {...mathPlugins}>{"Price: $5 and $10. Math: $$x$$"}</Markdown>)
  expect(html).toContain("Price: $5 and $10.")
  expect(html).toContain('class="katex"')
})

test("Markdown highlights by default without changing server text and supports opt-out", () => {
  const source = '```js\nconst value = 1\n```'
  const enabled = renderToStaticMarkup(<Markdown>{source}</Markdown>)
  const disabled = renderToStaticMarkup(<Markdown syntaxHighlighting={false}>{source}</Markdown>)
  expect(enabled).toContain("honest-syntax")
  expect(enabled).toContain("const value = 1")
  expect(disabled).not.toContain("honest-syntax")
  const custom = renderToStaticMarkup(<Markdown renderCodeLine={text => <em>{text}</em>}>{source}</Markdown>)
  expect(custom).not.toContain("honest-syntax")
  expect(custom).toContain("<em>const value = 1</em>")
})

test("Markdown applies the chosen palette to its code surface", () => {
  const html = renderToStaticMarkup(<Markdown syntaxPalette="graphite">{'```js\nconst n = 1\n```'}</Markdown>)
  expect(html).toContain('data-syntax-palette="graphite"')
  expect(html).toContain("honest-syntax")
})
