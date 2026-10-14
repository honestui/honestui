import rehypeKatex from "rehype-katex"
import remarkMath from "remark-math"

import type { MarkdownProps } from "../ai/markdown.js"

type MathPlugins = Required<Pick<MarkdownProps, "remarkPlugins" | "rehypePlugins">>

/**
 * The plugins that typeset math with KaTeX. Spread the result onto Markdown,
 * and import `katex/dist/katex.min.css` once in your app.
 *
 * Math is written between `$$`. A single `$` is left as text unless
 * `singleDollar` is set, so "$5 and $10" stays a pair of prices.
 *
 * Call this once, outside your components, so the plugins keep their identity.
 */
export function createMathPlugins({ singleDollar = false }: { singleDollar?: boolean } = {}): MathPlugins {
  return {
    remarkPlugins: [[remarkMath, { singleDollarTextMath: singleDollar }]],
    rehypePlugins: [rehypeKatex],
  }
}

export const mathPlugins = createMathPlugins()

// Exact backtick runs allow a code span to contain shorter runs of backticks.
const INLINE_CODE = /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g
const FENCE_LINE = /^ {0,3}(?:>[ \t]*)*(?:[-+*] |\d+[.)] )?[ \t]*(`{3,}|~{3,})(.*)$/

// `\[ … \]` that has its lines to itself, behind any list indent or quote marks.
const DISPLAY_MATH = /^([ \t]*(?:>[ \t]*)*)\\\[[ \t]*\r?\n([\s\S]*?)^\1\\\][ \t]*$/gm
const SINGLE_LINE_DISPLAY_MATH = /^([ \t]*(?:>[ \t]*)*)\\\[([^\n]+?)\\\][ \t]*$/gm
const INLINE_MATH = /\\\[(.+?)\\\]|\\\((.+?)\\\)/g

/**
 * Rewrites the LaTeX delimiters models often use, `\[ … \]` and `\( … \)`, as
 * the `$$` the math plugins read. Code is left alone, and so is a delimiter
 * whose closing half has not arrived yet.
 */
export function normalizeMathDelimiters(source: string) {
  function normalizeProse(text: string) {
    return text
      .replace(
        DISPLAY_MATH,
        (_match, prefix: string, math: string) => `${prefix}$$\n${math.trimEnd()}\n${prefix}$$`
      )
      .replace(
        SINGLE_LINE_DISPLAY_MATH,
        (_match, prefix: string, math: string) => `${prefix}$$\n${prefix}${math.trim()}\n${prefix}$$`
      )
      .replace(INLINE_MATH, (_match, bracketed?: string, parenthesized?: string) => {
        return `$$${(bracketed ?? parenthesized ?? "").trim()}$$`
      })
  }

  function normalizeOutsideInlineCode(text: string) {
    let result = ""
    let offset = 0
    for (const match of text.matchAll(INLINE_CODE)) {
      result += normalizeProse(text.slice(offset, match.index)) + match[0]
      offset = match.index + match[0].length
    }
    return result + normalizeProse(text.slice(offset))
  }

  let result = ""
  let proseStart = 0
  let offset = 0
  let fence: string | undefined
  let fenceStart = 0
  for (const line of source.split("\n")) {
    const match = FENCE_LINE.exec(line)
    if (match && fence === undefined) {
      result += normalizeOutsideInlineCode(source.slice(proseStart, offset))
      fence = match[1]
      fenceStart = offset
    } else if (
      match && fence && match[1][0] === fence[0] &&
      match[1].length >= fence.length && match[2].trim() === ""
    ) {
      result += source.slice(fenceStart, offset + line.length)
      proseStart = offset + line.length
      fence = undefined
    }
    offset += line.length + 1
  }

  // An unfinished fence is code through the end of the source.
  return result + (fence ? source.slice(fenceStart) : normalizeOutsideInlineCode(source.slice(proseStart)))
}
