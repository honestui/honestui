import { Star as StarIcon } from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"
import { PreviewCard, PreviewCardPopup, PreviewCardTrigger } from "@/registry/default/ui/preview-card"

export default function PreviewCardRepository() {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={<Button variant="link" />}>openai/codex</PreviewCardTrigger>
      <PreviewCardPopup>
        <div className="grid gap-2">
          <div className="font-medium">openai/codex</div>
          <p className="text-sm text-muted-foreground">A coding agent that works in your terminal.</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><StarIcon className="size-3" /> 42k stars</div>
        </div>
      </PreviewCardPopup>
    </PreviewCard>
  )
}
