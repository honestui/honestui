import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view"
import { StateEffect, StateField, type Extension, type Range, type Text } from "@codemirror/state"
import { HighlightStyle, syntaxHighlighting, syntaxTree } from "@codemirror/language"
import { tags as t, type Tag } from "@lezer/highlight"
import { semanticTokenRoles, type EditorSyntaxRole, type SyntaxPalette } from "./prose-syntax-shared.js"

export { semanticTokenRoles, type EditorSyntaxRole }

/**
 * Which CodeMirror highlight tags take each role. Colors come from
 * `prose-syntax-theme.css` through the `prose-syntax-*` classes, so palettes,
 * themes, and `--prose-syntax-*` overrides apply exactly as they do in Prose.
 */
// Grammars cannot tell a parameter from another variable; parameters come from semantic tokens.
export const codeMirrorRoleTags: Record<Exclude<EditorSyntaxRole, "plain" | "parameter">, Tag[]> = {
  comment: [t.comment, t.lineComment, t.blockComment, t.docComment],
  keyword: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword, t.modifier, t.self, t.heading],
  string: [t.string, t.special(t.string), t.regexp, t.character, t.link, t.url],
  constant: [t.number, t.integer, t.float, t.bool, t.null, t.atom, t.escape, t.unit, t.color, t.constant(t.variableName), t.labelName],
  function: [t.function(t.variableName), t.function(t.propertyName), t.function(t.definition(t.variableName)), t.macroName, t.annotation, t.meta],
  type: [t.typeName, t.className, t.namespace, t.standard(t.typeName)],
  property: [t.propertyName, t.definition(t.propertyName), t.attributeName],
  tag: [t.tagName],
  punctuation: [t.punctuation, t.separator, t.bracket, t.angleBracket, t.squareBracket, t.paren, t.brace],
  variable: [t.variableName, t.definition(t.variableName), t.local(t.variableName)],
  operator: [t.operator, t.derefOperator, t.arithmeticOperator, t.logicOperator, t.bitwiseOperator, t.compareOperator, t.updateOperator, t.definitionOperator, t.typeOperator, t.controlOperator],
  invalid: [t.invalid],
}

const honestHighlightStyle = HighlightStyle.define([
  ...Object.entries(codeMirrorRoleTags).map(([role, tag]) => ({ tag, class: `prose-syntax-${role}` })),
  // Markup carries meaning in its weight and style, not in a color.
  { tag: t.strong, fontWeight: "600" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, textDecoration: "underline" },
])

const role = (name: EditorSyntaxRole) => `var(--prose-syntax-${name}, var(--_syntax-${name}))`
const surface = "var(--prose-syntax-background, var(--_syntax-background))"
const highlight = "var(--prose-syntax-highlight, var(--_syntax-highlight))"
const rule = "var(--prose-syntax-rule, var(--_syntax-rule))"

// Editor chrome, drawn from the same variables as the code so one override restyles both.
const honestEditorTheme = EditorView.theme({
  // The editor scrolls inside `.cm-scroller`, not on its root.
  "&": { color: role("plain"), backgroundColor: surface, fontSize: "var(--prose-syntax-size, 0.8125rem)", overflowX: "visible" },
  "&.cm-focused": { outline: "2px solid currentColor", outlineOffset: "-2px" },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "var(--prose-syntax-leading, 1.65)" },
  ".cm-content": { caretColor: role("plain") },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: role("plain") },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: `color-mix(in oklab, ${role("keyword")} 28%, ${surface})`,
  },
  ".cm-activeLine": { backgroundColor: `color-mix(in oklab, ${highlight} 55%, transparent)` },
  ".cm-gutters": { backgroundColor: surface, color: role("comment"), borderRight: `0.5px solid ${rule}` },
  ".cm-activeLineGutter": { backgroundColor: highlight, color: role("plain") },
  ".cm-matchingBracket, &.cm-focused .cm-matchingBracket": { backgroundColor: highlight, outline: `1px solid ${rule}` },
  ".cm-nonmatchingBracket, &.cm-focused .cm-nonmatchingBracket": { color: role("invalid") },
  ".cm-searchMatch": { backgroundColor: highlight, outline: `1px solid ${role("comment")}` },
  ".cm-foldPlaceholder": { backgroundColor: highlight, border: `0.5px solid ${rule}`, color: role("comment") },
  ".cm-tooltip, .cm-panels": { backgroundColor: surface, color: role("plain"), border: `0.5px solid ${rule}` },
  ".cm-panels-top": { borderBottom: `0.5px solid ${rule}` },
  ".cm-panels-bottom": { borderTop: `0.5px solid ${rule}` },
  // Lint underlines are wavy lines in the role color, replacing CodeMirror's fixed-color images.
  ".cm-lintRange-error": { backgroundImage: "none", textDecoration: `underline wavy ${role("invalid")}`, textDecorationSkipInk: "none" },
  ".cm-lintRange-warning": { backgroundImage: "none", textDecoration: `underline wavy ${role("constant")}`, textDecorationSkipInk: "none" },
  ".cm-lintRange-info, .cm-lintRange-hint": { backgroundImage: "none", textDecoration: `underline dotted ${role("function")}`, textDecorationSkipInk: "none" },
  ".cm-diagnostic-error": { borderLeftColor: role("invalid") },
  ".cm-diagnostic-warning": { borderLeftColor: role("constant") },
  ".cm-diagnostic-info, .cm-diagnostic-hint": { borderLeftColor: role("function") },
})

/** A token from a language server or another analysis, in document positions. */
export type SemanticToken = { from: number; to: number; type: string; modifiers?: readonly string[] }
export type SemanticTokensLegend = { tokenTypes: readonly string[]; tokenModifiers: readonly string[] }


/**
 * Decodes a language server's `textDocument/semanticTokens` result. Each token
 * is five integers: line delta, start delta (from the previous token on the
 * same line), length, type index, and a modifier bit set. Positions are UTF-16
 * code units, as in CodeMirror. Tokens outside the document are dropped.
 */
export function decodeSemanticTokens(data: ArrayLike<number>, legend: SemanticTokensLegend, doc: Text): SemanticToken[] {
  const tokens: SemanticToken[] = []
  let line = 0
  let character = 0
  for (let index = 0; index + 4 < data.length; index += 5) {
    const deltaLine = data[index]
    line += deltaLine
    character = deltaLine === 0 ? character + data[index + 1] : data[index + 1]
    if (line >= doc.lines) break
    const type = legend.tokenTypes[data[index + 3]]
    const docLine = doc.line(line + 1)
    const from = docLine.from + character
    const to = Math.min(docLine.to, from + data[index + 2])
    if (!type || from >= to) continue
    const modifiers = legend.tokenModifiers.filter((_, bit) => data[index + 4] & (1 << bit))
    tokens.push({ from, to, type, modifiers })
  }
  return tokens
}

/** Replaces the editor's semantic tokens. Send it whenever the analysis finishes; edits in between keep tokens in place. */
export const setSemanticTokens = StateEffect.define<readonly SemanticToken[]>()

function semanticDecorations(tokens: readonly SemanticToken[], length: number) {
  const ranges: Range<Decoration>[] = []
  for (const token of tokens) {
    const tokenRole = Object.hasOwn(semanticTokenRoles, token.type) ? semanticTokenRoles[token.type] : undefined
    const classes = [tokenRole && `prose-syntax-${tokenRole}`, token.modifiers?.includes("deprecated") && "prose-syntax-deprecated"].filter(Boolean)
    if (classes.length === 0 || token.from < 0 || token.to > length || token.from >= token.to) continue
    // `prose-syntax-semantic` lets the stylesheet color the grammar spans nested inside it.
    ranges.push(Decoration.mark({ class: ["prose-syntax-semantic", ...classes].join(" ") }).range(token.from, token.to))
  }
  return Decoration.set(ranges, true)
}

const semanticTokenField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    let next = decorations.map(transaction.changes)
    for (const effect of transaction.effects) {
      if (effect.is(setSemanticTokens)) next = semanticDecorations(effect.value, transaction.state.doc.length)
    }
    return next
  },
  provide: field => EditorView.decorations.from(field),
})

const invalidMark = Decoration.mark({ class: "prose-syntax-invalid" })

// Marks the grammar's own error nodes in the visible ranges. An error node is
// often empty, so it marks the character beside it to stay visible.
function parseErrorDecorations(view: EditorView) {
  const ranges: Range<Decoration>[] = []
  const { doc } = view.state
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: node => {
        if (!node.type.isError) return
        let start = node.from
        let end = node.to
        if (start === end) {
          const line = doc.lineAt(start)
          if (end < line.to) end += 1
          else if (start > line.from) start -= 1
          else return
        }
        ranges.push(invalidMark.range(start, end))
      },
    })
  }
  return Decoration.set(ranges, true)
}

const parseErrors = ViewPlugin.fromClass(class {
  decorations: DecorationSet
  constructor(view: EditorView) {
    this.decorations = parseErrorDecorations(view)
  }
  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state)) {
      this.decorations = parseErrorDecorations(update.view)
    }
  }
}, { decorations: plugin => plugin.decorations })

export type HonestCodeMirrorOptions = {
  /** Token palette. Defaults to the stylesheet's default, Violet. */
  palette?: SyntaxPalette
  /** Pins light or dark. Without it, the editor follows `.light`, `.dark`, or the system scheme. */
  theme?: "light" | "dark"
  /** Marks code the grammar cannot parse as invalid. Defaults to true. */
  parseErrors?: boolean
}

/**
 * Honest Prose Syntax colors for a CodeMirror 6 editor. Import
 * `prose-syntax-theme.css` once; this extension maps CodeMirror's tags onto it
 * and styles the gutter, cursor, selection, panels, and lint underlines to match.
 * Send `setSemanticTokens` to color parameters and other semantic types.
 */
export function honestCodeMirror(options: HonestCodeMirrorOptions = {}): Extension {
  const attributes: Record<string, string> = { class: "honest-syntax" }
  if (options.palette) attributes["data-syntax-palette"] = options.palette
  if (options.theme) attributes["data-syntax-theme"] = options.theme
  return [
    EditorView.editorAttributes.of(attributes),
    honestEditorTheme,
    syntaxHighlighting(honestHighlightStyle),
    semanticTokenField,
    options.parseErrors === false ? [] : parseErrors,
  ]
}
