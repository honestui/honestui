const FENCE = /^ {0,3}(`{3,}|~{3,})/

// A link or image whose target has not finished arriving: `[label](https://exa`.
const PARTIAL_LINK = /(!?)\[([^\]\n]*)\]\([^)\s]*$/

const isSpace = (char: string | undefined) => char === undefined || /\s/.test(char)
const isWordCharacter = (char: string | undefined) => char !== undefined && /[\p{L}\p{N}]/u.test(char)

/** Reads one block's inline syntax and reports what is still open at its end. */
function scanInline(text: string) {
  // Emphasis markers waiting for their closer, outermost first.
  const open: string[] = []
  let codeMarker: string | null = null
  let codeStart = 0
  const codeSpans: [start: number, end: number][] = []
  // Where a marker that ends the text, and closes nothing, begins.
  let danglingAt = -1

  let index = 0
  while (index < text.length) {
    const char = text[index]

    if (char === "`") {
      let end = index
      while (text[end] === "`") end += 1
      const run = text.slice(index, end)
      if (codeMarker === null) {
        codeMarker = run
        codeStart = index
      } else if (codeMarker === run) {
        codeMarker = null
        codeSpans.push([codeStart, end])
      }
      index = end
      continue
    }

    if (codeMarker !== null) {
      index += 1
      continue
    }

    if (char === "\\") {
      index += 2
      continue
    }

    if (char === "*" || char === "_" || char === "~") {
      let end = index
      while (text[end] === char) end += 1
      const length = end - index
      const before = text[index - 1]
      const after = text[end]
      // An underscore inside a word, as in snake_case, is not emphasis.
      const canOpen = !isSpace(after) && !(char === "_" && isWordCharacter(before))
      const canClose = !isSpace(before) && !(char === "_" && isWordCharacter(after))
      const markers =
        char === "~"
          ? length === 2 ? ["~~"] : []
          : length === 1 ? [char] : length === 2 ? [char + char] : [char + char, char]

      let closedAny = false
      for (const marker of markers) {
        const position = canClose ? open.lastIndexOf(marker) : -1
        if (position !== -1) {
          // Markers opened after this one were never closed, so they are literal.
          open.length = position
          closedAny = true
        } else if (canOpen) {
          open.push(marker)
        }
      }
      if (after === undefined && !closedAny) danglingAt = index
      index = end
      continue
    }

    index += 1
  }

  return { open, codeMarker, codeStart, codeSpans, danglingAt }
}

/** Closes the inline syntax a block has opened but not yet finished. */
function closeInline(block: string) {
  let text = block
  let state = scanInline(text)

  if (state.codeMarker !== null) {
    const opener = state.codeStart + state.codeMarker.length
    // Backticks with nothing after them yet would only flash as literal text.
    if (opener >= text.length) return text.slice(0, state.codeStart)
    // Drop a closer that has half arrived, then close the span.
    return text.replace(/`+$/, "") + state.codeMarker
  }

  const link = PARTIAL_LINK.exec(text)
  if (link && !state.codeSpans.some(([start, end]) => link.index >= start && link.index < end)) {
    // An image has nothing to show yet. A link can already show its label.
    text = text.slice(0, link.index) + (link[1] ? "" : link[2])
    state = scanInline(text)
  }

  if (state.danglingAt !== -1) text = text.slice(0, state.danglingAt)
  if (state.open.length === 0) return text

  // A closer after a space does not close, so it goes before any trailing space.
  const body = text.trimEnd()
  return body + [...state.open].reverse().join("") + text.slice(body.length)
}

/**
 * Makes Markdown that is still arriving parse the way it will once it is
 * whole. Only the last block can be unfinished, so only it is changed: open
 * bold, italic, strikethrough, and inline code are closed, and a link or image
 * whose target has not arrived yet is held back. Finished text is not touched.
 */
export function repairMarkdown(source: string) {
  const lines = source.split("\n")
  let fenceMarker: string | null = null
  let lastBlockStart = 0

  lines.forEach((line, index) => {
    const marker = FENCE.exec(line)?.[1]
    if (marker && fenceMarker === null) {
      fenceMarker = marker
      lastBlockStart = index + 1
    } else if (
      marker &&
      fenceMarker !== null &&
      marker[0] === fenceMarker[0] &&
      marker.length >= fenceMarker.length &&
      line.trim() === marker
    ) {
      fenceMarker = null
      lastBlockStart = index + 1
    } else if (fenceMarker === null && line.trim() === "") {
      lastBlockStart = index + 1
    }
  })

  // An open code fence runs to the end of the text, which is how a parser reads it too.
  if (fenceMarker !== null || lastBlockStart >= lines.length) return source

  const finished = lines.slice(0, lastBlockStart)
  const lastBlock = lines.slice(lastBlockStart).join("\n")
  return [...finished, closeInline(lastBlock)].join("\n")
}
