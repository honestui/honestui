"use client"

import * as React from "react"

import { AgentScreen } from "@/registry/honest-ai/ai/agent-screen"
import { Button } from "@/registry/default/ui/button"

/** No agent is connected. The capture is a saved sample screenshot. */
export default function AgentScreenDemo() {
  const [note, setNote] = React.useState("")

  return (
    <div className="flex w-full max-w-[40rem] min-w-0 flex-col gap-[var(--hui-space-3)]">
      <AgentScreen
        title="Research agent's screen"
        src="/examples/crm-client-workspace.png"
        alt="A CRM workspace with a client list on the left and one client's details on the right."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setNote("Take over was pressed.")}>
            Take over
          </Button>
        }
      />
      <p
        role="status"
        className="m-0 min-h-[18px] px-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
      >
        {note}
      </p>
    </div>
  )
}
