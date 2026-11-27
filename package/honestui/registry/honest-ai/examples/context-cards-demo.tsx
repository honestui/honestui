import { ContextCards } from "@/registry/honest-ai/ai/context-cards"

export default function ContextCardsDemo() {
  return (
    <div className="w-full max-w-md min-w-0">
      <ContextCards
        title="Retrieved context"
        chunks={[
          {
            id: "focus",
            title: "Focus ring",
            meta: "Rank 1",
            body: "Keyboard focus is shown with a 1px accent ring. A control on an accent fill pushes the ring out by 2px so it clears the fill.",
            source: { label: "Accessibility", href: "/docs/accessibility" },
          },
          {
            id: "tokens",
            title: "Token naming",
            meta: "Rank 2",
            body: "Semantic tokens name a role, such as the primary foreground, and resolve to a different value in each theme.",
            source: { label: "tokens-notes.md" },
          },
        ]}
      />
    </div>
  )
}
