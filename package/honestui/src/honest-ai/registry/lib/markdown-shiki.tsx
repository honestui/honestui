"use client"

import * as React from "react"
import type { BundledLanguage, BundledTheme, Highlighter, ThemedToken } from "shiki"

import type { MarkdownCodeLine, MarkdownProps } from "../ai/markdown.js"

export type ShikiCodeLineOptions = {
  /** The theme for light surfaces. */
  light?: BundledTheme
  /** The theme used under Tailwind's `dark` variant. */
  dark?: BundledTheme
}

// How many highlighted blocks to keep. A block that is still arriving adds one each time it grows.
const CACHED_BLOCKS = 32

function createShikiStore({ light, dark }: Required<ShikiCodeLineOptions>) {
  const listeners = new Set<() => void>()
  const cache = new Map<string, ThemedToken[][]>()
  // Languages that are loaded, are loading, or cannot be loaded.
  const requested = new Set<string>()
  const loaded = new Set<string>()
  let highlighter: Highlighter | undefined
  let highlighterPromise: Promise<Highlighter> | undefined

  const notify = () => listeners.forEach((listener) => listener())

  async function load(language: string) {
    const shiki = await import("shiki")
    highlighterPromise ??= shiki.createHighlighter({ themes: [light, dark], langs: [] })
    const instance = await highlighterPromise

    // An unknown language stays plain text.
    if (!(language in shiki.bundledLanguages)) return
    await instance.loadLanguage(language as BundledLanguage)

    highlighter = instance
    loaded.add(language)
    notify()
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    /** Starts loading a language. Call it from an effect. */
    request(language: string) {
      if (requested.has(language)) return
      requested.add(language)
      // A highlighter that fails to load leaves the code as plain text, which is still correct.
      load(language).catch(() => undefined)
    },

    /** The block's tokens by line, or nothing while its language is not loaded. */
    getLines(code: string, language: string) {
      if (!highlighter || !loaded.has(language)) return undefined

      const key = `${language}\n${code}`
      let lines = cache.get(key)
      if (!lines) {
        lines = highlighter.codeToTokens(code, {
          lang: language as BundledLanguage,
          themes: { light, dark },
          defaultColor: false,
        }).tokens
        cache.set(key, lines)
        if (cache.size > CACHED_BLOCKS) cache.delete(cache.keys().next().value as string)
      }
      return lines
    },
  }
}

type ShikiStore = ReturnType<typeof createShikiStore>

function ShikiLine({
  store,
  text,
  language,
  line,
}: {
  store: ShikiStore
  text: string
  language: string
  line: MarkdownCodeLine
}) {
  const lines = React.useSyncExternalStore(
    store.subscribe,
    () => store.getLines(line.code, language),
    () => undefined
  )
  React.useEffect(() => store.request(language), [store, language])

  const tokens = lines?.[line.index]
  if (!tokens) return text

  return tokens.map((token, index) => (
    <span
      key={index}
      style={token.htmlStyle}
      className="text-[var(--shiki-light)] dark:text-[var(--shiki-dark)]"
    >
      {token.content}
    </span>
  ))
}

/**
 * Makes a `renderCodeLine` for Markdown that colors code with Shiki. Shiki and
 * each language load the first time a block needs them; until then, and for a
 * language Shiki does not know, the code is plain text.
 *
 * Call this once, outside your components.
 */
export function createShikiCodeLine({
  light = "github-light-high-contrast",
  dark = "github-dark-high-contrast",
}: ShikiCodeLineOptions = {}): NonNullable<MarkdownProps["renderCodeLine"]> {
  const store = createShikiStore({ light, dark })

  return function renderShikiCodeLine(text, language, line) {
    if (language === undefined) return text
    return <ShikiLine store={store} text={text} language={language} line={line} />
  }
}
