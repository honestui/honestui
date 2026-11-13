import styles from "@/components/landing/landing.module.css"

// The same palette Shiki renders the editor with (github-*-high-contrast),
// so a one-line snippet reads like the full source files next to it.
const COLORS = {
  keyword: ["#A0111F", "#FF9492"],
  string: ["#032563", "#ADDCFF"],
  tag: ["#024C1A", "#72F088"],
  attr: ["#023B95", "#91CBFF"],
  command: ["#702C00", "#FFB757"],
  comment: ["#66707B", "#9EA7B3"],
} as const

type Kind = keyof typeof COLORS
type Lang = "tsx" | "bash" | "css"

const RULES: Record<Lang, [RegExp, Kind | ((match: string, index: number) => Kind | null)][]> = {
  tsx: [
    [/\/\*[\s\S]*?\*\/|\/\/.*/y, "comment"],
    [/"[^"]*"|'[^']*'/y, "string"],
    [/\b(?:import|from|export|const|return)\b/y, "keyword"],
    [/(?<=<\/?)[A-Za-z][\w.]*/y, "tag"],
    [/[\w-]+(?==)/y, "attr"],
    [/=\{|=|\{|\}/y, "keyword"],
  ],
  bash: [
    [/#.*/y, "comment"],
    [/[^\s]+/y, (_, index) => (index === 0 ? "command" : "string")],
  ],
  css: [
    [/\/\*[\s\S]*?\*\//y, "comment"],
    [/--[\w-]+/y, "attr"],
    [/\d+(?:\.\d+)?(?:px|rem|%)?/y, "command"],
  ],
}

function tokenize(code: string, lang: Lang) {
  const out: { text: string; kind: Kind | null }[] = []
  let plain = ""
  let words = 0
  let i = 0
  while (i < code.length) {
    let matched = false
    for (const [re, kind] of RULES[lang]) {
      re.lastIndex = i
      const m = re.exec(code)
      if (!m || m[0].length === 0) continue
      const k = typeof kind === "function" ? kind(m[0], words) : kind
      if (plain) out.push({ text: plain, kind: null })
      plain = ""
      out.push({ text: m[0], kind: k })
      if (lang === "bash") words += 1
      i += m[0].length
      matched = true
      break
    }
    if (!matched) {
      if (lang === "bash" && code[i] === "\n") words = 0
      plain += code[i]
      i += 1
    }
  }
  if (plain) out.push({ text: plain, kind: null })
  return out
}

/** Syntax-colored inline code for short snippets on the landing page. */
export function CodeTokens({
  code,
  lang = "tsx",
  className,
  onMedia,
}: {
  code: string
  lang?: Lang
  className?: string
  onMedia?: boolean
}) {
  return (
    <code
      className={[styles.hl, className].filter(Boolean).join(" ")}
      data-on-media={onMedia || undefined}
    >
      {tokenize(code, lang).map((token, i) =>
        token.kind ? (
          <span
            key={i}
            style={
              {
                "--l": COLORS[token.kind][0],
                "--d": COLORS[token.kind][1],
              } as React.CSSProperties
            }
          >
            {token.text}
          </span>
        ) : (
          token.text
        ),
      )}
    </code>
  )
}
