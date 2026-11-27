"use client"

import * as React from "react"
import { Check as CheckIcon, Copy as CopyIcon } from "honestui/icons"
import { Button } from "@/registry/default/ui/button"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/registry/default/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/registry/default/ui/select"
import { SyntaxCode } from "@/registry/honest-ai/lib/prose-syntax-react"
import { syntaxTailwind } from "@/registry/honest-ai/lib/prose-syntax-tailwind"

const samples = {
  typescript: { label: "TypeScript", code: '// Keep the original order.\ntype User = { name: string; active: boolean }\n\nexport function activeNames(users: User[]) {\n  return users.filter(user => user.active)\n    .map(user => user.name)\n}\n' },
  python: { label: "Python", code: '# Keep the original order.\ndef active_names(users):\n    return [user["name"] for user in users\n            if user["active"]]\n' },
  html: { label: "HTML", code: '<!-- A named, native control. -->\n<label for="name">Name</label>\n<input id="name" name="name" required>\n' },
  sql: { label: "SQL", code: '-- Keep a predictable order.\nSELECT name FROM users\nWHERE active = TRUE\nORDER BY created_at;\n' },
  json: { label: "JSON", code: '{\n  "name": "Ada",\n  "active": true,\n  "roles": ["editor"]\n}\n' },
}
type Language = keyof typeof samples

const palettes = {
  violet: { label: "Violet", description: "Soft violet, blue, and green accents." },
  graphite: { label: "Graphite", description: "Mostly neutral; keywords in muted slate." },
}
type Palette = keyof typeof palettes

const COPIED_MILLISECONDS = 1500

export default function ProseSyntaxDemo({ tailwind = false }: { tailwind?: boolean }) {
  const [palette, setPalette] = React.useState<Palette>("violet")
  const id = React.useId()
  const [language, setLanguage] = React.useState<Language>("typescript")
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "failed">("idle")
  const resetTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(samples[language].code)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopyState("idle"), COPIED_MILLISECONDS)
  }

  return <section className="not-prose w-full min-w-0" aria-label="Syntax playground">
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <label htmlFor={`${id}-palette`} className="text-sm font-medium">Palette</label>
      <Select items={Object.fromEntries(Object.entries(palettes).map(([key, value]) => [key, value.label]))} value={palette} onValueChange={value => { if (value && Object.hasOwn(palettes, value)) setPalette(value as Palette) }}>
        <SelectTrigger id={`${id}-palette`} aria-label="Palette" aria-describedby={`${id}-palette-description`} size="sm" className="w-32"><SelectValue /></SelectTrigger>
        <SelectContent>{Object.entries(palettes).map(([value, { label }]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
      </Select>
      <p id={`${id}-palette-description`} className="m-0 text-sm text-[var(--hui-color-foreground-base-secondary)]">{palettes[palette].description}</p>
    </div>
    <Tabs value={language} onValueChange={value => { setLanguage(value as Language); setCopyState("idle") }}>
      {/* The same frame as the docs' code blocks: a shell with the language and Copy, around the code. */}
      <div className="flex flex-col rounded-[8px] bg-[var(--hui-color-background-neutral-primary)] p-1">
        <div className="flex items-center justify-between gap-2 pr-1 pl-2">
          <TabsList aria-label="Language" variant="underline" className="no-scrollbar min-w-0 justify-start! gap-3! overflow-x-auto">
            {Object.entries(samples).map(([value, { label }]) => <TabsTab key={value} value={value} className="h-5! px-1.5 hover:bg-transparent!">{label}</TabsTab>)}
          </TabsList>
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 rounded" aria-label="Copy code" onClick={() => void copy()}>
            {copyState === "copied" ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
          </Button>
          <span role="status" className="sr-only">{copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : ""}</span>
        </div>
        {Object.entries(samples).map(([value, { label, code }]) => <TabsPanel key={value} value={value} className="mt-1">
          {/* The shell above is the frame, so the code keeps only its hairline. */}
          <SyntaxCode data-syntax-palette={palette} aria-label={`${label} example`} code={code} language={value} className={`m-0 min-h-48 [&&]:border-0! [&&]:rounded-[5px]! ${tailwind ? syntaxTailwind : ""}`} />
        </TabsPanel>)}
      </div>
    </Tabs>
  </section>
}
