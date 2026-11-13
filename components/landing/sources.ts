import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import { highlightCode } from "@/lib/highlight-code"
import type { AssemblyStep } from "@/components/landing/assembly"
import type { InstallItem } from "@/components/landing/install-playground"

const UI_DIR = path.join(process.cwd(), "components", "ui")

function titleCase(name: string) {
  return name
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")
}

/** Component names, read from the files the site actually ships. */
export async function getComponentNames() {
  const files = await readdir(UI_DIR)
  return files
    .filter((f) => f.endsWith(".tsx") && !f.startsWith("toast-gooey") && !f.startsWith("__"))
    .map((f) => titleCase(f.replace(".tsx", "")))
}

const INSTALLABLE = [
  ["button", "Button"],
  ["dialog", "Dialog"],
  ["tabs", "Tabs"],
  ["select", "Select"],
  ["slider", "Slider"],
  ["table", "Table"],
] as const

/** The real source of each component, so the editor shows the file you get. */
export async function getInstallItems(): Promise<InstallItem[]> {
  return Promise.all(
    INSTALLABLE.map(async ([name, title]) => {
      const source = await readFile(path.join(UI_DIR, `${name}.tsx`), "utf8")
      const lines = source.split("\n")
      const excerpt = lines.slice(0, 40).join("\n")
      return {
        name,
        title,
        lines: lines.length,
        html: await highlightCode(excerpt, "tsx", { showLineNumbers: false }),
      }
    }),
  )
}

const STEPS = [
  {
    title: "Tokens",
    body: "Color, radius, space, type and focus are CSS variables you can read and override.",
    file: "styles/tokens.css",
    lang: "css",
    code: `[data-theme="light"] {
  --hui-accent-9: oklch(0.5438 0.191 267.01);
  --hui-color-background-neutral-emphasis:
    var(--hui-neutral-12);
}

:root {
  --hui-radius-2: 10px;
  --hui-space-5: 16px;
  --hui-font-size-control: 14px;
}`,
  },
  {
    title: "Primitive",
    body: "A button is those tokens on an accessible element. Nothing is generated at runtime.",
    file: "components/ui/button.tsx",
    lang: "tsx",
    code: `<Button>Send invite</Button>

// default variant
"rounded-[var(--hui-radius-2)]",
"[font-size:var(--hui-font-size-control)]",
"focus-visible:[outline:var(--hui-focus-ring)]",`,
  },
  {
    title: "Component",
    body: "Primitives compose into a card you write yourself, in your own file.",
    file: "app/team/invite-card.tsx",
    lang: "tsx",
    code: `<Card>
  <CardHeader>
    <CardTitle>Invite teammate</CardTitle>
    <Badge variant="secondary">7 left</Badge>
  </CardHeader>
  <Label htmlFor="email">Email</Label>
  <Input id="email" placeholder="name@acme.com" />
  <Button>Send invite</Button>
</Card>`,
  },
  {
    title: "Product",
    body: "The same pieces build a whole dashboard, and every layer stays editable.",
    file: "app/team/page.tsx",
    lang: "tsx",
    code: `<SidebarProvider>
  <AppSidebar />
  <main>
    <TeamHeader />
    <KpiRow seats={18} pending={3} />
    <BarChart data={activity} />
    <InviteCard />
  </main>
</SidebarProvider>`,
  },
]

export async function getAssemblySteps(): Promise<AssemblyStep[]> {
  return Promise.all(
    STEPS.map(async ({ code, lang, ...step }) => ({
      ...step,
      html: await highlightCode(code, lang, { showLineNumbers: false }),
    })),
  )
}
