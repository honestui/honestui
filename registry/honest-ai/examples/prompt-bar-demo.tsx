"use client"

import * as React from "react"
import {
  FileText as FileTextIcon,
  Globe as GlobeIcon,
  Terminal as TerminalIcon,
} from "honestui/icons"

import {
  PromptBar,
  type PromptBarItem,
  type PromptBarModel,
  type PromptBarSubmission,
} from "@/registry/honest-ai/ai/prompt-bar"

// Sample sources, commands, and models.
const sampleMentions: PromptBarItem[] = [
  { id: "invoices", label: "invoices", description: "Billing database", icon: <FileTextIcon /> },
  { id: "runbook", label: "runbook", description: "On-call notes", icon: <FileTextIcon /> },
  { id: "web", label: "web", description: "Search the public web", icon: <GlobeIcon /> },
  { id: "terminal", label: "terminal", description: "Recent shell output", icon: <TerminalIcon /> },
]

const sampleCommands: PromptBarItem[] = [
  { id: "summarize", label: "summarize", description: "Condense the thread so far" },
  { id: "plan", label: "plan", description: "Draft steps before changing anything" },
  { id: "review", label: "review", description: "Check the last change for problems" },
]

const sampleModels: PromptBarModel[] = [
  { id: "sample-large", label: "Sample Large", description: "Most capable" },
  { id: "sample-small", label: "Sample Small", description: "Fastest" },
]

/** This preview sends nothing. It shows the object your `onSubmit` receives. */
export default function PromptBarDemo() {
  const [received, setReceived] = React.useState<PromptBarSubmission | null>(null)

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-5)]">
      <PromptBar
        placeholder="Ask about the billing export…"
        mentions={sampleMentions}
        commands={sampleCommands}
        models={sampleModels}
        allowAttachments
        onSubmit={setReceived}
      />
      {/* What `onSubmit` received, shown once something is sent. */}
      <div aria-live="polite" className="min-h-[var(--hui-space-15)] px-[var(--hui-space-3)]">
        {received && (
          <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
            <dt className="text-[var(--hui-color-foreground-base-secondary)]">Text</dt>
            <dd className="m-0 break-words text-[var(--hui-color-foreground-base-primary)]">
              {received.text || "None"}
            </dd>
            <dt className="text-[var(--hui-color-foreground-base-secondary)]">Model</dt>
            <dd className="m-0 font-mono text-[var(--hui-color-foreground-base-primary)]">{received.model}</dd>
            <dt className="text-[var(--hui-color-foreground-base-secondary)]">Files</dt>
            <dd className="m-0 break-words text-[var(--hui-color-foreground-base-primary)]">
              {received.attachments.length > 0
                ? received.attachments.map((file) => file.name).join(", ")
                : "None"}
            </dd>
          </dl>
        )}
      </div>
    </div>
  )
}
