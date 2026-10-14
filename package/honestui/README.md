# Honest UI

Copy editable React components into your app with the Honest UI CLI, or import components and libraries from the npm package.

The CLI installs source you maintain. Package imports receive updates when you upgrade `honestui`. AI components, prose, syntax, and generative UI require version 0.2.3 or later.

## Requirements

- Node.js 20.18.1 or later
- React 19 for React exports
- Tailwind CSS v4 for copied AI components

Package exports are ES modules with TypeScript declarations. Compiled AI component styles are included, so those imports can work without a Tailwind build.

## Add editable components

Run the CLI from an existing React project:

```bash
npx honestui@latest init
npx honestui@latest add button
```

The CLI writes the selected component source into your project. Use `--dry-run` to preview an add operation when the project already has a `components.json` file.

AI components, prose, syntax, and generative UI also install by name:

```bash
npx honestui@latest add prompt-bar chat-thread markdown
npx honestui@latest add prose prose-syntax-react
npx honestui@latest add generative-chat
```

AI items ship with the CLI and resolve by name. Their core UI dependencies come from the Honest UI registry. Direct registry URLs still work.

| Installed source | Destination |
| --- | --- |
| AI components | `components/ai` |
| Utilities | `lib` |
| Prose and syntax styles | `styles` |
| Generative UI runtime | `lib/generative` |

Import the installed prose and syntax stylesheets in your application root.

## Import package collections

Install the package when you use charts, icons, logos, vectors, or shaders:

```bash
npm install honestui
```

```tsx
import { BarChart, type ChartConfig } from "honestui/charts"
import "honestui/charts.css"

import { Search } from "honestui/icons"
import { Vercel } from "honestui/logos"
import { Abstract1Shapes } from "honestui/vectors"

import { LightRays } from "honestui/shaders"
```

Load `honestui/charts.css` once in your application root when you use charts. Shaders use Tailwind utilities and do not require a separate stylesheet.

To size a whole section with one `data-density` scope, import `honestui/density.css` after Tailwind CSS in your stylesheet. See the [density guide](https://honestui.com/docs/components/density).

## AI components

Use package imports when you want updates through npm instead of managing copied source:

```tsx
"use client"

import { PromptBar } from "honestui/ai/prompt-bar"
import "honestui/ai.css"

export function Composer({ onSend }: { onSend: (text: string) => void }) {
  return (
    <PromptBar
      placeholder="Ask something"
      onSubmit={({ text }) => onSend(text)}
    />
  )
}
```

Import individual components from `honestui/ai/<component-name>`, or use the `honestui/ai` barrel. Components render the state and callbacks your app supplies. `PromptBar` collects input; your `onSubmit` handler decides what happens next. It does not call a model.

Load `honestui/ai.css` once for AI component utilities and generated charts. `Markdown` also needs `honestui/prose.css` and `honestui/syntax.css`.

## Theme setup

Apps initialized with Honest UI can keep their existing theme. For a standalone app, import `honestui/theme.css` before your overrides and set the root attributes:

```html
<html data-style="modern" data-theme="light" class="light">
```

For dark mode, change both `data-theme` and the class to `dark`. `data-style` selects the radius tokens; the class also controls syntax highlighting and Tailwind dark variants.

Set `--font-love-sans` and `--font-jetbrains-mono` to use your fonts. Set your page's background and text color with `--hui-color-background-base-primary` and `--hui-color-foreground-base-primary`.

## Prose

Import `honestui/prose.css` and add `honest-prose` to the wrapper around rendered Markdown or HTML:

```tsx
import "honestui/prose.css"

export function Article() {
  return (
    <article className="honest-prose">
      <h1>Release notes</h1>
      <p>Components can be copied into an app or imported from the package.</p>
    </article>
  )
}
```

The stylesheet also works with plain HTML. It uses Honest UI tokens when available and provides fallbacks.

`honestui/prose` exports `repairMarkdown` for unfinished Markdown, plus `proseTailwind` and `proseTailwindClasses` for Tailwind utilities. Those utilities need a Tailwind v4 build that scans their class strings. Use `prose.css` if you do not have that build.

## Syntax highlighting

For React:

```tsx
import { SyntaxCode } from "honestui/syntax/react"
import "honestui/syntax.css"

export function CodeExample() {
  return <SyntaxCode code="const answer = 42" language="javascript" />
}
```

Browser highlighting runs in a worker. In Vite, add `worker: { format: "es" }` to your config so the worker can load grammar chunks. With other bundlers or self-hosting, deploy the worker and its grammar chunks together. `useSyntax` and `createBrowserHighlighter` accept a `workerFactory` for custom worker setup.

For server rendering, use `createHighlighter` from `honestui/syntax` and call `dispose()` when finished. Other entry points are `honestui/syntax/browser` for DOM highlighting, `/codemirror` for editor integration, `/themes` for VS Code and Monaco theme generation, and `/tailwind` for Tailwind styles. The worker is exported as `honestui/syntax/worker`.

## Generative UI

`honestui/genui` exports the renderer and standard component libraries. Render a fixed program before connecting a model:

```tsx
"use client"

import { Renderer, honestChatLibrary } from "honestui/genui"
import "honestui/ai.css"
import "honestui/prose.css"
import "honestui/syntax.css"

export function GeneratedReply() {
  return (
    <Renderer
      library={honestChatLibrary}
      response={'root = Stack([Callout("info", "Status", "Ready")])'}
    />
  )
}
```

Use `honestui/genui/react` to build a custom library without importing the standard catalog. `honestui/genui/chat` adds `GenerativeChat` and the headless conversation runtime; your app supplies its `llm` adapter. Generated maps need your app's geocoding, tiles, attribution, and map worker configuration.

Server code has a separate entry point with no React dependency:

```ts
import { createParser, honestChatSpec } from "honestui/genui/server"
import { createAutofix } from "honestui/genui/server/openai"

const parser = createParser(honestChatSpec.schema, honestChatSpec.root)
const validation = createAutofix({ library: honestChatSpec })
```

Server helpers include prompt generation, parsing, and validation. Repair uses a callback you supply; it does not select a model or make a default model request. Keep model credentials on your server.

The CLI retains Zod v3 schemas through `zod/v3`; generative UI uses `zod/v4`. Custom generative component schemas must use Zod v4.

## Optional integrations

Install the SDK or plugins for the integration you use. Supported versions are declared in the package's optional peer dependencies.

| Integration | Entry point | Additional packages |
| --- | --- | --- |
| OpenAI | `honestui/genui/server/openai` | `openai` |
| Vercel AI SDK | `honestui/genui/server/vercel` | `ai` |
| LangGraph history | `honestui/genui/server/langgraph` | `@langchain/core`, `openai` |
| CodeMirror | `honestui/syntax/codemirror` | `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@lezer/highlight` |
| Markdown math | `honestui/ai/markdown-math` | `remark-math`, `rehype-katex`, `katex` |

The chat runtime also includes an Eve adapter. The Eve SDK requires Node 24. `honestui/ai/markdown-shiki` provides the optional Shiki code-line renderer.

For math, use KaTeX 0.18.2 and import `katex/dist/katex.min.css`. The upstream Markdown plugins can install older transitive copies; add `"overrides": { "katex": "0.18.2" }` to your app's `package.json` so they use the patched version too.

## Maintainer source sync

AI implementation and registry metadata come from the Honest AI repository. Run `npm run honestui:sync` there to refresh `src/honest-ai`, or `npm run honestui:check` to detect drift. The snapshot includes licenses and a content manifest. This package builds and verifies independently of a sibling checkout; `npm run verify:ai` validates the checked-in snapshot. Run `npm run honestui:verify` in Honest AI to test the packed package in a production Vite browser fixture.

## Registry API

The root entry point exposes registry functions for tooling:

```ts
import { getRegistry, getRegistryItems } from "honestui"
```

Registry authentication headers are scoped to each request. They are not stored in process-global state.

## Documentation

- [Honest UI](https://honestui.com/docs)
- [Honest AI components, prose, and generative UI](https://ai.honestui.com/docs)

Honest UI is available under the MIT license.
