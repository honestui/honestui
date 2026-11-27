import {
  ThinkingQuery,
  ThinkingSource,
  ThinkingState,
  ThinkingText,
} from "@/registry/honest-ai/ai/thinking-state"

export default function ThinkingStateSearchExample() {
  return (
    <div className="w-full max-w-sm min-w-0">
      <ThinkingState status="done" label="Read 2 sources" defaultOpen>
        <ThinkingQuery>focus indicator contrast requirement</ThinkingQuery>
        <ThinkingSource
          href="https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html"
          title="Understanding Focus Appearance"
          domain="w3.org"
        />
        <ThinkingSource
          href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html"
          title="Understanding Non-text Contrast"
          domain="w3.org"
        />
        <ThinkingText>
          Both pages agree on a 3:1 ratio against adjacent colors, so the ring only needs a darker
          border token.
        </ThinkingText>
      </ThinkingState>
    </div>
  )
}
