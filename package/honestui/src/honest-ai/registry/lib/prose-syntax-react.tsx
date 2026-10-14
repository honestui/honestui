"use client"

import * as React from "react"
import { createSyntaxClient } from "./prose-syntax-client.js"
import type { SyntaxClientOptions } from "./prose-syntax-client.js"
import { plainResult } from "./prose-syntax-shared.js"
import type { SyntaxResult, SyntaxToken } from "./prose-syntax-shared.js"

let sharedClient: ReturnType<typeof createSyntaxClient> | undefined
let subscribers = 0

export function SyntaxLine({ tokens }: { tokens: SyntaxToken[] }) {
  return tokens.map((token, index) => <span key={index} className={`prose-syntax-${token.role}`}>{token.text}</span>)
}

/** Source stays visible during loading. Results belong to an exact source version. */
export function useSyntax(code: string, language?: string, enabled = true, options?: SyntaxClientOptions) {
  const session = React.useId()
  const [snapshot, setSnapshot] = React.useState<{ code: string; language?: string; result: SyntaxResult }>()
  const client = React.useRef<ReturnType<typeof createSyntaxClient> | undefined>(undefined)
  React.useEffect(() => {
    if (!enabled || !language) return
    const instance = options ? createSyntaxClient(options) : (sharedClient ??= createSyntaxClient())
    if (!options) subscribers++
    client.current = instance
    return () => {
      instance.release(session)
      if (options) instance.dispose()
      else if (--subscribers === 0) { sharedClient?.dispose(); sharedClient = undefined }
      client.current = undefined
    }
  }, [enabled, language, options, session])
  React.useEffect(() => {
    if (!enabled || !language || !client.current) return
    let current = true
    let ready: SyntaxResult | undefined
    const apply = () => {
      if (current && ready && (!document.getSelection() || document.getSelection()!.isCollapsed)) setSnapshot({ code, language, result: ready })
    }
    document.addEventListener("selectionchange", apply)
    void client.current.highlight(code, { language, session }).then(result => { ready = result; apply() })
    return () => { current = false; document.removeEventListener("selectionchange", apply) }
  }, [code, language, enabled, session, options])
  if (!enabled || !snapshot || snapshot.language !== language) return undefined
  if (snapshot.code === code) return snapshot.result
  // Keep completed lines colored while an appended suffix is being processed.
  if (code.startsWith(snapshot.code)) {
    const boundary = snapshot.code.lastIndexOf("\n") + 1
    const count = snapshot.code.slice(0, boundary).split("\n").length - 1
    return { lines: [...snapshot.result.lines.slice(0, count), ...plainResult(code.slice(boundary)).lines], highlighted: snapshot.result.highlighted }
  }
  return undefined
}

export function SyntaxCode({ code, language, ...props }: { code: string; language?: string } & React.ComponentProps<"pre">) {
  const result = useSyntax(code, language)
  return <pre tabIndex={0} aria-label="Code" {...props} className={`honest-syntax ${props.className ?? ""}`}><code>{result ? result.lines.map((tokens, index) => <React.Fragment key={index}>{index > 0 && "\n"}<SyntaxLine tokens={tokens} /></React.Fragment>) : code}</code></pre>
}
