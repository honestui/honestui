import path from "node:path"
import type { Config } from "@/src/utils/get-config"
import { transformCssVars } from "@/src/utils/updaters/update-css-vars"
import postcss from "postcss"
import type Declaration from "postcss/lib/declaration"
import type Rule from "postcss/lib/rule"
import { describe, expect, it } from "vitest"

function createConfig(cssFile = "app/globals.css") {
  const cwd = "/project"

  return {
    tailwind: { baseColor: "neutral", css: cssFile, cssVariables: true },
    resolvedPaths: {
      cwd,
      tailwindCss: path.resolve(cwd, cssFile),
    },
  } as Config
}

function declarationsFor(output: string, selector: string, prop: string) {
  const root = postcss.parse(output)
  const rule = root.nodes.find(
    (node): node is Rule =>
      node.type === "rule" && node.selectors.includes(selector)
  )

  return rule?.nodes.filter(
    (node): node is Declaration => node.type === "decl" && node.prop === prop
  )
}

describe("transformCssVars", () => {
  it("preserves existing v4 values and unrelated Next.js body styles by default", async () => {
    const input = `@import "tailwindcss";
@custom-variant hocus (&:is(:hover, :focus));

:root, :host {
  --background: user-background;
  --custom-token: keep-me;
}

@theme inline {
  --font-sans: user-font;
}

body {
  background: linear-gradient(red, blue);
  font-family: Arial, Helvetica, sans-serif;
}
`
    const cssVars = {
      theme: { "--font-sans": "preset-font" },
      light: {
        background: "preset-background",
        foreground: "preset-foreground",
      },
    }

    const first = await transformCssVars(
      input,
      cssVars,
      createConfig(),
      { tailwindVersion: "v4", overwriteCssVars: false }
    )
    const second = await transformCssVars(
      first,
      cssVars,
      createConfig(),
      { tailwindVersion: "v4", overwriteCssVars: false }
    )

    expect(first).toContain("--background: user-background")
    expect(first).toContain("--foreground: preset-foreground")
    expect(first).toContain("--font-sans: user-font")
    expect(first).toContain("--custom-token: keep-me")
    expect(first).toContain("background: linear-gradient(red, blue)")
    expect(first).toContain("font-family: Arial, Helvetica, sans-serif")
    expect(first).toContain("@custom-variant hocus")
    expect(first).toContain("@custom-variant dark (&:is(.dark *))")
    expect(first.endsWith("\n")).toBe(true)
    expect(second).toBe(first)
  })

  it("overwrites every matching v4 preset token in combined selectors", async () => {
    const input = `@import "tailwindcss";

:root, :host {
  --background: old-value;
  --background: fallback-value;
}

@theme inline {
  --font-sans: old-font;
  --font-sans: fallback-font;
}
`

    const output = await transformCssVars(
      input,
      {
        theme: { "--font-sans": "preset-font" },
        light: { background: "preset-background" },
      },
      createConfig(),
      { tailwindVersion: "v4", overwriteCssVars: true }
    )

    const backgroundDeclarations = declarationsFor(
      output,
      ":root",
      "--background"
    )
    expect(backgroundDeclarations).toHaveLength(2)
    expect(
      backgroundDeclarations?.every(
        (node) => node.value === "preset-background"
      )
    ).toBe(true)
    expect(output).not.toContain("old-font")
    expect(output).not.toContain("fallback-font")
    expect(output.match(/--font-sans: preset-font/g)).toHaveLength(2)
  })

  it("updates v3 variables in a combined root selector", async () => {
    const input = `@tailwind base;

@layer base {
  :root, :host {
    --background: old-value;
    --custom-token: keep-me;
  }
}
`

    const output = await transformCssVars(
      input,
      { light: { background: "preset-background" } },
      createConfig(),
      { tailwindVersion: "v3" }
    )

    expect(output).toContain("--background: preset-background")
    expect(output).toContain("--custom-token: keep-me")
    expect(output).not.toContain("--background: old-value")
  })

  it("handles an empty v4 stylesheet", async () => {
    const output = await transformCssVars(
      "",
      { light: { background: "preset-background" } },
      createConfig(),
      { tailwindVersion: "v4", overwriteCssVars: true }
    )

    expect(output).toContain("@custom-variant dark (&:is(.dark *))")
    expect(output).toContain("--background: preset-background")
  })

  it("parses SCSS variables and comments", async () => {
    const input = `@import "tailwindcss";
$accent: red;

.example {
  // Keep this SCSS comment.
  color: $accent;
}
`

    const output = await transformCssVars(
      input,
      { light: { background: "preset-background" } },
      createConfig("src/globals.scss"),
      { tailwindVersion: "v4", overwriteCssVars: true }
    )

    expect(output).toContain("$accent: red")
    expect(output).toContain("// Keep this SCSS comment.")
    expect(output).toContain("--background: preset-background")
  })
})
