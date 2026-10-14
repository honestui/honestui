import { syntaxPaletteColors } from "./prose-syntax-palettes.js"
import { semanticTokenRoles, syntaxRoleScopes, syntaxRoles, type EditorSyntaxRole, type SyntaxPalette } from "./prose-syntax-shared.js"

export type SyntaxMode = "light" | "dark"
type Colors = Record<EditorSyntaxRole | "background" | "highlight" | "frame" | "rule", string>

const paletteLabels: Record<SyntaxPalette, string> = { violet: "Violet", graphite: "Graphite" }

function colorsFor(palette: SyntaxPalette, mode: SyntaxMode): Colors {
  return syntaxPaletteColors[palette][mode]
}

// The stylesheet mixes selection and the active line with CSS; editors that
// take literal colors get the same mixes, in sRGB, with alpha where they allow it.
function mix(color: string, base: string, weight: number) {
  const channel = (hex: string, index: number) => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16)
  return `#${[0, 1, 2].map(index => Math.round(channel(color, index) * weight + channel(base, index) * (1 - weight)).toString(16).padStart(2, "0")).join("")}`
}

function chrome(colors: Colors) {
  return {
    "editor.background": colors.background,
    "editor.foreground": colors.plain,
    "editorCursor.foreground": colors.plain,
    "editor.selectionBackground": mix(colors.keyword, colors.background, 0.28),
    "editor.lineHighlightBackground": `${colors.highlight}8c`,
    "editorLineNumber.foreground": colors.comment,
    "editorLineNumber.activeForeground": colors.plain,
    "editorGutter.background": colors.background,
    "editorBracketMatch.background": colors.highlight,
    "editorBracketMatch.border": colors.rule,
    "editorIndentGuide.background1": colors.rule,
    "editorWhitespace.foreground": colors.rule,
    "editorWidget.background": colors.background,
    "editorWidget.border": colors.rule,
    "editorError.foreground": colors.invalid,
    "editorWarning.foreground": colors.constant,
    "editorInfo.foreground": colors.function,
  }
}

type SemanticStyle = string | { foreground?: string; italic?: boolean; strikethrough?: boolean }

export type VSCodeTheme = {
  name: string
  type: SyntaxMode
  semanticHighlighting: true
  colors: Record<string, string>
  tokenColors: { scope: string[]; settings: { foreground?: string; fontStyle?: string } }[]
  semanticTokenColors: Record<string, SemanticStyle>
}

/** A VS Code color theme, for an extension's `contributes.themes`. Semantic highlighting colors parameters. */
export function vscodeTheme(palette: SyntaxPalette = "violet", mode: SyntaxMode = "light"): VSCodeTheme {
  const colors = colorsFor(palette, mode)
  return {
    name: `Honest ${paletteLabels[palette]} ${mode === "light" ? "Light" : "Dark"}`,
    type: mode,
    semanticHighlighting: true,
    colors: chrome(colors),
    // TextMate picks the most specific matching scope, so order here does not matter.
    tokenColors: [
      ...syntaxRoles.filter(role => role !== "plain").map(role => ({ scope: syntaxRoleScopes[role], settings: { foreground: colors[role] } })),
      { scope: ["variable"], settings: { foreground: colors.variable } },
      { scope: ["variable.parameter"], settings: { foreground: colors.parameter, fontStyle: "italic" } },
      { scope: ["keyword.operator"], settings: { foreground: colors.operator } },
      { scope: ["invalid", "invalid.illegal"], settings: { foreground: colors.invalid, fontStyle: "underline" } },
      { scope: ["markup.bold"], settings: { fontStyle: "bold" } },
      { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
      { scope: ["markup.strikethrough"], settings: { fontStyle: "strikethrough" } },
    ],
    semanticTokenColors: {
      ...Object.fromEntries(Object.entries(semanticTokenRoles).map(([type, role]) => [type, role === "parameter" ? { foreground: colors.parameter, italic: true } : colors[role]])),
      "*.deprecated": { strikethrough: true },
    },
  }
}

// Monaco's built-in (Monarch) grammars name tokens differently from TextMate.
const monacoTokens: Partial<Record<EditorSyntaxRole, string[]>> = {
  comment: ["comment"],
  keyword: ["keyword"],
  string: ["string", "attribute.value", "regexp"],
  constant: ["number", "constant"],
  function: ["predefined", "annotation"],
  type: ["type", "type.identifier"],
  property: ["attribute.name", "key"],
  tag: ["tag", "metatag"],
  punctuation: ["delimiter"],
  variable: ["identifier", "variable"],
  operator: ["operator", "operators"],
  invalid: ["invalid"],
}

/** Data for `monaco.editor.defineTheme`. Enable `"semanticHighlighting.enabled"` to color parameters from a language service. */
export function monacoTheme(palette: SyntaxPalette = "violet", mode: SyntaxMode = "light") {
  const colors = colorsFor(palette, mode)
  const foreground = (role: EditorSyntaxRole) => colors[role].slice(1)
  return {
    base: mode === "light" ? "vs" : "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: foreground("plain"), background: colors.background.slice(1) },
      ...Object.entries(monacoTokens).flatMap(([role, tokens]) => tokens.map(token => ({ token, foreground: foreground(role as EditorSyntaxRole), ...(role === "invalid" ? { fontStyle: "underline" } : {}) }))),
      // Semantic token types, as Monaco names them when semantic highlighting is on.
      ...Object.entries(semanticTokenRoles).map(([type, role]) => ({ token: type, foreground: foreground(role), ...(role === "parameter" ? { fontStyle: "italic" } : {}) })),
    ],
    colors: chrome(colors),
  } as const
}
