"use client"

import * as React from "react"
import ReactMarkdown, { type Components, type ExtraProps, type Options } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "../../lib/utils.js"
import { languageDisplayName, type SyntaxPalette } from "../lib/prose-syntax-shared.js"
import { SyntaxLine, useSyntax } from "../lib/prose-syntax-react.js"

import { ProseCodeBlock } from "./prose-code-block.js"
import { repairMarkdown } from "../lib/repair-markdown.js"

export type MarkdownLabels = {
  /** Titles a code block that names no language. */
  code: string
  table: string
  /** The link text for an image that has no description. */
  image: string
  taskDone: string
  taskOpen: string
  /** Stands in for a block from `blocks` until its closing fence arrives. */
  blockPending: string
}

export const defaultMarkdownLabels: MarkdownLabels = {
  code: "Code",
  table: "Table",
  image: "Image",
  taskDone: "Done",
  taskOpen: "Not done",
  blockPending: "Waiting for the rest of this block…",
}

// The part of a syntax tree this file reads. Declared here so installing the
// component does not also install a package of types.
type TreeNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: TreeNode[]
}

const caretContainers = new Set(["ul", "ol", "li", "blockquote", "p", "h1", "h2", "h3", "h4", "h5", "h6"])
const caretHolders = new Set(["p", "li", "h1", "h2", "h3", "h4", "h5", "h6"])
const caretBlockers = new Set(["pre", "table", "hr"])

const caret: TreeNode = {
  type: "element",
  tagName: "span",
  properties: {
    ariaHidden: "true",
    dataSlot: "markdown-caret",
    className:
      "ms-0.5 inline-block h-[1em] w-0.5 translate-y-[0.15em] rounded-full bg-[var(--hui-color-foreground-base-primary)]",
  },
  children: [],
}

/** Puts a caret after the last words of the text, wherever they are nested. */
function rehypeStreamingCaret() {
  return (tree: TreeNode) => {
    let parent = tree
    let last: TreeNode | undefined

    for (;;) {
      last = parent.children?.findLast((child) => child.type !== "text" || child.value?.trim() !== "")
      if (last?.type !== "element" || !caretContainers.has(last.tagName ?? "")) break
      parent = last
    }

    const isEmpty = parent === tree && last === undefined
    const endsInText = caretHolders.has(parent.tagName ?? "") && !caretBlockers.has(last?.tagName ?? "")
    if (isEmpty || endsInText) parent.children?.push(caret)
  }
}

/** A fenced code block, as its renderers receive it. */
export type MarkdownCodeBlock = {
  code: string
  /** The word after the opening fence, such as `ts`. */
  language: string | undefined
  /** From `title="…"` or `filename="…"` after the language. */
  title: string | undefined
}

export type MarkdownCodeLine = {
  /** The line's place in the block, from zero. */
  index: number
  /** The whole block, for a highlighter that reads across lines. */
  code: string
}

/**
 * Draws one fenced block from its text. Throw when the text is not what the
 * block expects, and the source is shown as code instead.
 */
export type MarkdownBlockRenderer = (body: string) => React.ReactNode

type MarkdownSettings = {
  source: string
  isStreaming: boolean
  labels: MarkdownLabels
  blocks: Record<string, MarkdownBlockRenderer> | undefined
  syntaxPalette: SyntaxPalette
  syntaxHighlighting: boolean
  renderCodeLine: MarkdownProps["renderCodeLine"]
  renderCodeActions: MarkdownProps["renderCodeActions"]
}

// The element renderers below are defined once, so a block keeps its state
// while the text around it changes. They read the current props from here.
const MarkdownSettingsContext = React.createContext<MarkdownSettings | null>(null)

function useMarkdownSettings() {
  const settings = React.useContext(MarkdownSettingsContext)
  if (settings === null) throw new Error("This element must be rendered inside Markdown.")
  return settings
}

const FENCE_META_TITLE = /(?:^|\s)(?:title|filename)=(?:"([^"]*)"|'([^']*)'|(\S+))/
const OPENING_FENCE_LINE = /^[\s>]*(`{3,}|~{3,})/
const CLOSING_FENCE_LINE = /^[\s>]*(`{3,}|~{3,})\s*$/

type FenceNode = NonNullable<ExtraProps["node"]>

/** Whether the fence that produced this node has its closing line in the text. */
function isFenceClosed(node: FenceNode | undefined, source: string) {
  const start = node?.position?.start.offset
  const end = node?.position?.end.offset
  if (start === undefined || end === undefined) return true

  const lines = source.slice(start, end).trimEnd().split("\n")
  const opening = OPENING_FENCE_LINE.exec(lines[0])?.[1]
  const closing = CLOSING_FENCE_LINE.exec(lines[lines.length - 1])?.[1]
  return (
    lines.length > 1 &&
    opening !== undefined &&
    closing !== undefined &&
    opening[0] === closing[0] &&
    closing.length >= opening.length
  )
}

/** Runs a block's renderer. The text is the model's, so one that does not fit is expected, not an error. */
function drawBlock(render: MarkdownBlockRenderer, body: string) {
  try {
    return { content: render(body) }
  } catch {
    // The caller shows the text as code instead, which loses nothing.
    return null
  }
}

function MarkdownPre({ children, node }: React.ComponentProps<"pre"> & ExtraProps) {
  const { source, isStreaming, labels, blocks, renderCodeLine, renderCodeActions, syntaxHighlighting, syntaxPalette } = useMarkdownSettings()

  const codeElement = React.Children.toArray(children).find(
    (child): child is React.ReactElement<{ className?: string; children?: React.ReactNode }> =>
      React.isValidElement(child)
  )
  const codeNode = node?.children.find((child) => child.type === "element" && child.tagName === "code")
  const meta = (codeNode?.data as { meta?: string | null } | undefined)?.meta ?? ""
  const titleMatch = FENCE_META_TITLE.exec(meta)

  const block: MarkdownCodeBlock = {
    // The parser ends a block with a line break, which would list an empty last line.
    code: React.Children.toArray(codeElement?.props.children).join("").replace(/\n$/, ""),
    language: /language-(\S+)/.exec(codeElement?.props.className ?? "")?.[1],
    title: titleMatch ? (titleMatch[1] ?? titleMatch[2] ?? titleMatch[3]) : undefined,
  }

  const syntax = useSyntax(block.code, block.language, syntaxHighlighting && !renderCodeLine && !(block.language && blocks && Object.hasOwn(blocks, block.language)))

  // `hasOwn`, so a language such as "constructor" does not find a method of every object.
  const renderBlock =
    block.language !== undefined && blocks && Object.hasOwn(blocks, block.language)
      ? blocks[block.language]
      : undefined
  if (renderBlock) {
    // Half a block's data would fail to parse, or draw something untrue.
    if (isStreaming && !isFenceClosed(node, source)) {
      return (
        <p
          data-slot="markdown-block-pending"
          className="text-[var(--hui-color-foreground-base-secondary)]"
        >
          {labels.blockPending}
        </p>
      )
    }

    const drawn = drawBlock(renderBlock, block.code)
    if (drawn) {
      return (
        <div data-slot="markdown-block" data-language={block.language} className="not-prose">
          {drawn.content}
        </div>
      )
    }
  }

  const { code, language } = block
  return (
    <ProseCodeBlock
      // A title is a file name and stays as written; a language shows as people write it.
      label={block.title ?? (language ? languageDisplayName(language) : labels.code)}
      code={code}
      codeProps={{ "data-syntax-palette": syntaxPalette }}
      codeClassName={syntaxHighlighting && !renderCodeLine ? "honest-syntax" : undefined}
      renderLine={renderCodeLine ? ((text, index) => renderCodeLine(text, language, { index, code })) : syntax ? ((text, index) => syntax.lines[index] ? <SyntaxLine tokens={syntax.lines[index]} /> : text) : undefined}
      actions={renderCodeActions?.(block)}
    />
  )
}

// Loading an image sends a request to a URL the text chose, which can carry
// data out of the conversation. A link leaves that request to the person.
function MarkdownImage({ src, alt }: React.ComponentProps<"img">) {
  const { labels } = useMarkdownSettings()
  const text = alt || labels.image
  return typeof src === "string" && src !== "" ? <a href={src}>{text}</a> : <span>{text}</span>
}

function MarkdownTable({ children }: React.ComponentProps<"table">) {
  const { labels } = useMarkdownSettings()
  return (
    // Focusable so a keyboard user can scroll a wide table.
    <div
      role="group"
      aria-label={labels.table}
      tabIndex={0}
      data-slot="markdown-table"
      className="prose-scroll outline-none focus-visible:[outline:var(--hui-focus-ring)]"
    >
      <table>{children}</table>
    </div>
  )
}

// A task list item's checkbox is a record of the text, not a control.
function MarkdownTaskCheckbox({ type, checked }: React.ComponentProps<"input">) {
  const { labels } = useMarkdownSettings()
  return (
    <input
      type={type}
      checked={checked}
      disabled
      readOnly
      aria-label={checked ? labels.taskDone : labels.taskOpen}
    />
  )
}

const defaultComponents: Components = {
  pre: MarkdownPre,
  img: MarkdownImage,
  table: MarkdownTable,
  input: MarkdownTaskCheckbox,
}

export type MarkdownProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The Markdown source, all of it or as much as has arrived. */
  children: string
  /** Set while text is still arriving. Closes unfinished syntax and shows a caret. */
  isStreaming?: boolean
  /**
   * Draws a fenced block as a component, by the fence's language. A block is
   * held back until its closing fence arrives.
   */
  blocks?: Record<string, MarkdownBlockRenderer>
  /** Enable Honest Prose Syntax. Defaults to true; custom renderers take precedence. */
  syntaxHighlighting?: boolean
  /** Token colors; each palette follows the current light or dark theme. */
  syntaxPalette?: SyntaxPalette
  /** Overrides built-in syntax highlighting for each line. */
  renderCodeLine?: (
    text: string,
    language: string | undefined,
    line: MarkdownCodeLine
  ) => React.ReactNode
  /** Controls for a code block's header, placed before Copy. */
  renderCodeActions?: (block: MarkdownCodeBlock) => React.ReactNode
  /** Replaces how an element is rendered, such as `a` or `img`. */
  components?: Components
  /** Parser plugins that run after GitHub Flavored Markdown. */
  remarkPlugins?: NonNullable<Options["remarkPlugins"]>
  /** Tree plugins that run before the caret is placed. */
  rehypePlugins?: NonNullable<Options["rehypePlugins"]>
  labels?: Partial<MarkdownLabels>
}

/**
 * Renders Markdown, including Markdown that is still arriving. It parses the
 * text it is given without loading URLs selected by that text: HTML is shown as text,
 * and an image becomes a link, so a reply cannot make the browser load a URL.
 * Its text is styled by the `honest-prose` class, from `prose.css`.
 */
function Markdown({
  children,
  isStreaming = false,
  syntaxHighlighting = true,
  syntaxPalette = "violet",
  blocks,
  renderCodeLine,
  renderCodeActions,
  components: componentsProp,
  remarkPlugins: remarkPluginsProp,
  rehypePlugins: rehypePluginsProp,
  labels: labelsProp,
  className,
  ...props
}: MarkdownProps) {
  const source = isStreaming ? repairMarkdown(children) : children

  const settings = React.useMemo<MarkdownSettings>(
    () => ({
      source,
      isStreaming,
      syntaxHighlighting,
      syntaxPalette,
      labels: { ...defaultMarkdownLabels, ...labelsProp },
      blocks,
      renderCodeLine,
      renderCodeActions,
    }),
    [source, isStreaming, syntaxHighlighting, syntaxPalette, labelsProp, blocks, renderCodeLine, renderCodeActions]
  )
  const components = React.useMemo<Components>(
    () => ({ ...defaultComponents, ...componentsProp }),
    [componentsProp]
  )
  const remarkPlugins = React.useMemo(
    () => [remarkGfm, ...(remarkPluginsProp ?? [])],
    [remarkPluginsProp]
  )
  const rehypePlugins = React.useMemo(
    () => [...(rehypePluginsProp ?? []), ...(isStreaming ? [rehypeStreamingCaret] : [])],
    [rehypePluginsProp, isStreaming]
  )

  return (
    <div
      data-slot="markdown"
      data-streaming={isStreaming ? "" : undefined}
      className={cn("honest-prose", className)}
      {...props}
    >
      <MarkdownSettingsContext.Provider value={settings}>
        <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
          {source}
        </ReactMarkdown>
      </MarkdownSettingsContext.Provider>
    </div>
  )
}

export { Markdown, repairMarkdown }
