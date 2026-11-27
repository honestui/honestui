import { readFile, writeFile } from "node:fs/promises"

// The stylesheet is the source of truth. Editors that need literal colors,
// such as Monaco and VS Code, read this generated copy of it.
const css = await readFile("registry/honest-ai/styles/prose-syntax-theme.css", "utf8")
const modes = ["light", "dark"]
const surfaces = {}
const defaults = { light: {}, dark: {} }
for (const [, body] of css.matchAll(/\{([^{}]+)\}/g)) {
  const mode = /--_syntax-palette-\w+-(light|dark)/.exec(body)?.[1]
  if (!mode || !body.includes("--_syntax-background:")) continue
  for (const [, role, color] of body.matchAll(/--_syntax-(\w+): var\(--_syntax-palette-\w+-(?:light|dark), (#[\da-f]{6})\)/g)) defaults[mode][role] = color
  surfaces[mode] = Object.fromEntries([...body.matchAll(/--_syntax-(background|highlight|frame|rule): (#[\da-f]{6})/g)].map(([, name, color]) => [name, color]))
}
const palettes = {}
for (const [, name, body] of css.matchAll(/data-syntax-palette="(\w+)"\] \{([^{}]+)\}/g)) {
  palettes[name] = Object.fromEntries(modes.map(mode => [mode, {
    ...Object.fromEntries([...body.matchAll(new RegExp(`--_syntax-palette-(\\w+)-${mode}: (#[\\da-f]{6})`, "g"))].map(([, role, color]) => [role, color])),
    ...surfaces[mode],
  }]))
}
for (const mode of modes) {
  if (!surfaces[mode] || Object.keys(defaults[mode]).length === 0) throw new Error(`No ${mode} surfaces or defaults found in the syntax theme.`)
  // The unnamed default must be one of the named palettes, so editors can name it.
  if (!Object.values(palettes).some(palette => Object.entries(defaults[mode]).every(([role, color]) => palette[mode][role] === color))) {
    throw new Error(`The ${mode} default colors match no named palette.`)
  }
}

const output = `// Generated from registry/styles/prose-syntax-theme.css by npm run syntax:generate.
/** Literal palette colors, for editors that cannot read CSS variables. */
export const syntaxPaletteColors = ${JSON.stringify(palettes, null, 2)} as const
`
const path = "registry/honest-ai/lib/prose-syntax-palettes.ts"
if (process.argv.includes("--check")) {
  if (await readFile(path, "utf8").catch(() => "") !== output) throw new Error("Syntax palette colors are stale. Run npm run syntax:generate.")
} else await writeFile(path, output)
