import { ThinkingState, ThinkingStep } from "@/registry/honest-ai/ai/thinking-state"

export default function ThinkingStateErrorExample() {
  return (
    <div className="w-full max-w-sm min-w-0">
      <ThinkingState status="error" label="Stopped after 2 steps" defaultOpen>
        <ThinkingStep detail="schema.sql" detailIsCode>
          Read
        </ThinkingStep>
        <ThinkingStep status="error" detail="npm run migrate" detailIsCode>
          Run
        </ThinkingStep>
      </ThinkingState>
    </div>
  )
}
