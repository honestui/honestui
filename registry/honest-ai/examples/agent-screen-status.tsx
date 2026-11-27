import { AgentScreen } from "@/registry/honest-ai/ai/agent-screen"

export default function AgentScreenStatusExample() {
  return (
    <div className="grid w-full max-w-xl min-w-0 gap-[var(--hui-space-5)] sm:grid-cols-2">
      <AgentScreen title="Billing agent's screen" status="connecting" alt="" />
      <AgentScreen title="Support agent's screen" status="offline" alt="" />
    </div>
  )
}
