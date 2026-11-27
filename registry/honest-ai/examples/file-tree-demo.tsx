"use client"

import * as React from "react"

import { FileTree, type FileTreeNode } from "@/registry/honest-ai/ai/file-tree"

const nodes: FileTreeNode[] = [
  {
    name: "app",
    children: [
      { name: "layout.tsx" },
      { name: "page.tsx", change: "modified" },
      {
        name: "invoices",
        children: [
          { name: "page.tsx", change: "added" },
          { name: "invoice-row.tsx", change: "added" },
        ],
      },
    ],
  },
  {
    name: "lib",
    children: [
      { name: "export.ts", change: "modified" },
      { name: "legacy-export.ts", change: "deleted" },
      { name: "utils.ts" },
    ],
  },
  { name: "public", children: [{ name: "logo.svg" }] },
  { name: "package.json", change: "modified" },
  { name: "README.md" },
]

export default function FileTreeDemo() {
  const [selected, setSelected] = React.useState<string | null>("app/invoices/page.tsx")
  return (
    <div className="w-full max-w-xs min-w-0">
      <FileTree
        title="honest-app"
        nodes={nodes}
        defaultExpanded={["app", "app/invoices", "lib"]}
        selected={selected}
        onSelect={(id) => setSelected(id)}
      />
    </div>
  )
}
