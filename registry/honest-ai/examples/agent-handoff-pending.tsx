"use client"

import * as React from "react"
import { RotateCcw as RotateCcwIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import { AgentHandoff, type HandoffStatus } from "@/registry/honest-ai/ai/agent-handoff"

export default function AgentHandoffPending() {
  const [status, setStatus] = React.useState<HandoffStatus>("pending")

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)]">
      <AgentHandoff
        from={{ name: "Research agent", role: "Gathers sources" }}
        to={{ name: "Legal review", role: "Needs a person to approve" }}
        status={status}
        reason="The draft quotes two contracts. Anything quoting a contract has to be checked by legal before it is sent."
        summary="Draft reply to Acme about renewal terms, quoting sections 4.2 and 7.1 of the 2025 master agreement."
        items={[{ name: "acme-msa-2025.pdf", meta: "PDF · 240 KB" }, { name: "draft-reply.md" }]}
        tokens={3860}
        onAccept={() => setStatus("accepted")}
        onDecline={() => setStatus("declined")}
      />
      {status !== "pending" && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setStatus("pending")}>
            <RotateCcwIcon aria-hidden="true" />
            Replay
          </Button>
        </div>
      )}
    </div>
  )
}
