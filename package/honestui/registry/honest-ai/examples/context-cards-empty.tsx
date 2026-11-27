import { ContextCards } from "@/registry/honest-ai/ai/context-cards"

export default function ContextCardsEmptyExample() {
  return (
    <div className="w-full max-w-md min-w-0">
      <ContextCards
        title="Context for this answer"
        chunks={[]}
        emptyMessage="No passages matched this question, so the answer uses no retrieved context."
      />
    </div>
  )
}
