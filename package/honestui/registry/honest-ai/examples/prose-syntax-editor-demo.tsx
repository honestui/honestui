"use client"

import * as React from "react"
import { EditorView, basicSetup } from "codemirror"
import { Compartment, type Extension } from "@codemirror/state"
import { ViewPlugin, type ViewUpdate } from "@codemirror/view"
import { syntaxTree } from "@codemirror/language"
import { linter, type Diagnostic } from "@codemirror/lint"
import { Tabs, TabsList, TabsTab } from "@/registry/default/ui/tabs"
import { honestCodeMirror, setSemanticTokens, type SemanticToken } from "@/registry/honest-ai/lib/prose-syntax-codemirror"

const languages = {
  typescript: {
    label: "TypeScript",
    file: "active-names.ts",
    load: () => import("@codemirror/lang-javascript").then(module => module.javascript({ typescript: true })),
    code: `// Parameters are italic. Type == to see a lint warning.
type User = { name: string; active: boolean; visits: number }

export function activeNames(users: User[], minimum = 1) {
  return users
    .filter(user => user.active && user.visits >= minimum)
    .map(user => \`\${user.name} (\${user.visits})\`)
}
`,
  },
  python: {
    label: "Python",
    file: "active_names.py",
    load: () => import("@codemirror/lang-python").then(module => module.python()),
    code: `# Keep the original order.
def active_names(users, minimum=1):
    return [user["name"] for user in users
            if user["active"] and user["visits"] >= minimum]
`,
  },
  html: {
    label: "HTML",
    file: "signup.html",
    load: () => import("@codemirror/lang-html").then(module => module.html()),
    code: `<!-- A named, native control. -->
<form action="/signup" method="post">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>
  <button>Sign up</button>
</form>
`,
  },
  css: {
    label: "CSS",
    file: "card.css",
    load: () => import("@codemirror/lang-css").then(module => module.css()),
    code: `/* Follow the theme's surface. */
.card {
  padding: 1rem;
  border: 0.5px solid var(--hui-color-border-base-primary);
  border-radius: 8px;
}
`,
  },
  json: {
    label: "JSON",
    file: "user.json",
    load: () => import("@codemirror/lang-json").then(module => module.json()),
    code: `{
  "name": "Ada",
  "active": true,
  "visits": 12,
  "roles": ["editor"]
}
`,
  },
  sql: {
    label: "SQL",
    file: "active-users.sql",
    load: () => import("@codemirror/lang-sql").then(module => module.sql()),
    code: `-- Keep a predictable order.
SELECT name, visits FROM users
WHERE active = TRUE AND visits >= 1
ORDER BY created_at;
`,
  },
  markdown: {
    label: "Markdown",
    file: "README.md",
    load: () => import("@codemirror/lang-markdown").then(module => module.markdown()),
    code: `# Active users

Lists **active** users in their *original* order. See [the guide](https://example.com).
`,
  },
}
type Language = keyof typeof languages

// Stands in for a language server: marks each function's parameters and their
// uses by name. It ignores shadowing, which a real language service resolves.
function parameterTokens(view: EditorView): SemanticToken[] {
  const tokens: SemanticToken[] = []
  const { state } = view
  syntaxTree(state).iterate({
    enter: node => {
      if (node.name !== "ParamList") return
      const names = new Set<string>()
      let child = node.node.firstChild
      while (child) {
        if (child.name === "VariableDefinition") {
          names.add(state.sliceDoc(child.from, child.to))
          tokens.push({ from: child.from, to: child.to, type: "parameter" })
        }
        child = child.nextSibling
      }
      const body = node.node.parent
      if (!body || names.size === 0) return
      syntaxTree(state).iterate({
        from: node.to,
        to: body.to,
        enter: use => {
          if (use.name === "VariableName" && names.has(state.sliceDoc(use.from, use.to))) tokens.push({ from: use.from, to: use.to, type: "parameter" })
        },
      })
    },
  })
  return tokens
}

const parameterAnalysis = ViewPlugin.fromClass(class {
  constructor(view: EditorView) {
    this.schedule(view)
  }
  update(update: ViewUpdate) {
    if (syntaxTree(update.startState) !== syntaxTree(update.state)) this.schedule(update.view)
  }
  // A view cannot dispatch while it updates, so the result is sent just after.
  schedule(view: EditorView) {
    queueMicrotask(() => view.dispatch({ effects: setSemanticTokens.of(parameterTokens(view)) }))
  }
})

// A small, real rule, to show the theme's lint underline.
const strictEquality = linter(view => {
  const diagnostics: Diagnostic[] = []
  syntaxTree(view.state).iterate({
    enter: node => {
      const text = view.state.sliceDoc(node.from, node.to)
      if (node.name === "CompareOp" && (text === "==" || text === "!=")) {
        diagnostics.push({ from: node.from, to: node.to, severity: "warning", message: `Use ${text}= to compare without type conversion.` })
      }
    },
  })
  return diagnostics
}, { delay: 300 })

export default function ProseSyntaxEditorDemo() {
  const host = React.useRef<HTMLDivElement>(null)
  const view = React.useRef<EditorView | null>(null)
  const languageSlot = React.useRef(new Compartment())
  const analysisSlot = React.useRef(new Compartment())
  // Edits survive switching tabs.
  const drafts = React.useRef<Record<string, string>>({})
  const [language, setLanguage] = React.useState<Language>("typescript")
  const shown = React.useRef<Language>("typescript")

  React.useEffect(() => {
    if (!host.current) return
    const editor = new EditorView({
      doc: languages.typescript.code,
      parent: host.current,
      extensions: [basicSetup, languageSlot.current.of([]), analysisSlot.current.of([]), honestCodeMirror(), strictEquality, EditorView.contentAttributes.of({ "aria-label": "Code editor" })],
    })
    view.current = editor
    return () => {
      view.current = null
      editor.destroy()
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    void languages[language].load().then((extension: Extension) => {
      const editor = view.current
      if (cancelled || !editor) return
      drafts.current[shown.current] = editor.state.doc.toString()
      shown.current = language
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: drafts.current[language] ?? languages[language].code },
        effects: [
          languageSlot.current.reconfigure(extension),
          analysisSlot.current.reconfigure(language === "typescript" ? parameterAnalysis : []),
          setSemanticTokens.of([]),
        ],
      })
      editor.contentDOM.setAttribute("aria-label", `${languages[language].file}, ${languages[language].label} editor`)
    })
    return () => {
      cancelled = true
    }
  }, [language])

  return <section className="not-prose w-full min-w-0" aria-label="Editor example">
    <Tabs value={language} onValueChange={value => setLanguage(value as Language)}>
      {/* The same frame as the docs' code blocks, with the language tabs in the shell. The file name is in the editor's label. */}
      <div className="flex flex-col rounded-[8px] bg-[var(--hui-color-background-neutral-primary)] p-1">
        <div className="px-2">
          <TabsList aria-label="Language" variant="underline" className="no-scrollbar min-w-0 justify-start! gap-3! overflow-x-auto">
            {Object.entries(languages).map(([value, { label }]) => <TabsTab key={value} value={value} className="h-5! px-1.5 hover:bg-transparent!">{label}</TabsTab>)}
          </TabsList>
        </div>
        <div ref={host} className="mt-1 min-h-56 overflow-hidden rounded-[5px] shadow-[inset_0_0_0_0.5px_var(--hui-color-border-base-primary)] [&_.cm-editor]:min-h-56" />
      </div>
    </Tabs>
  </section>
}
