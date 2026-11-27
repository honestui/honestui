"use client"

import * as React from "react"

import { ChatMessage, ChatThread } from "@/registry/honest-ai/ai/chat-thread"

// Sample conversation. Each edit of the question is kept as a version.
const sampleVersions = ["Why are export totals off?", "Why are export totals off by a cent?"]

const sampleAttachments = [
  { name: "q3-invoices.csv", meta: "48 KB" },
  { name: "export-settings.json", meta: "2 KB" },
]

/**
 * No model replies here. Sending an edit adds it as a new version of the
 * question, and the arrows move between the versions.
 */
export default function ChatThreadEditingExample() {
  const [versions, setVersions] = React.useState(sampleVersions)
  const [version, setVersion] = React.useState(sampleVersions.length)

  return (
    <div className="h-72 w-full max-w-lg min-w-0">
      <ChatThread label="Conversation with the billing agent">
        <ChatMessage
          role="user"
          author="You"
          attachments={sampleAttachments}
          editText={versions[version - 1]}
          onEdit={(text) => {
            setVersions([...versions, text])
            setVersion(versions.length + 1)
          }}
          version={version}
          versionCount={versions.length}
          onVersionChange={setVersion}
        >
          {versions[version - 1]}
        </ChatMessage>
        <ChatMessage role="assistant" author="Billing agent">
          Each row is rounded to cents before the rows are summed. Round once, after the sum, and the drift goes away.
        </ChatMessage>
      </ChatThread>
    </div>
  )
}
