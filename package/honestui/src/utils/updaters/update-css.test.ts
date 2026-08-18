import { transformCss } from "@/src/utils/updaters/update-css"
import { describe, expect, it } from "vitest"

describe("transformCss", () => {
  it("deduplicates equivalent imports and preserves unrelated formatting", async () => {
    const input = `@import 'tw-animate-css';

.alpha {
  color: red;
}



.omega {
  color: blue;
}
`

    const output = await transformCss(input, {
      '@import "tw-animate-css"': {},
      ".target": { color: "green" },
    })

    expect(output.match(/@import/g)).toHaveLength(1)
    expect(output).toContain(".alpha {\n  color: red;\n}\n\n\n\n.omega")
    expect(output).toContain(".target")
    expect(output.endsWith("\n")).toBe(true)
  })

  it("updates every duplicate declaration so a later fallback cannot win", async () => {
    const output = await transformCss(
      `.target {
  color: old;
  color: fallback;
}`,
      { ".target": { color: "green" } }
    )

    expect(output).not.toContain("old")
    expect(output).not.toContain("fallback")
    expect(output.match(/color: green/g)).toHaveLength(2)
  })

  it("parses SCSS syntax and is idempotent", async () => {
    const input = `@import "tailwindcss";
$accent: red;

.example {
  // Keep this SCSS comment.
  color: $accent;
}
`
    const css = {
      "@layer base": {
        body: { "@apply bg-background text-foreground": {} },
      },
    }

    const first = await transformCss(input, css, {
      cssFilepath: "/project/src/globals.scss",
    })
    const second = await transformCss(first, css, {
      cssFilepath: "/project/src/globals.scss",
    })

    expect(first).toContain("// Keep this SCSS comment.")
    expect(first).toContain("color: $accent")
    expect(first).toContain("@layer base")
    expect(second).toBe(first)
  })

  it("preserves CRLF line endings", async () => {
    const input = ".alpha {\r\n  color: red;\r\n}\r\n"
    const output = await transformCss(input, {
      ".target": { color: "green" },
    })

    expect(output.replace(/\r\n/g, "")).not.toContain("\n")
    expect(output.endsWith("\r\n")).toBe(true)
  })
})
