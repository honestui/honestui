import { Button } from "@/registry/default/ui/button"
import { Badge } from "@/registry/default/ui/badge"
import { PreviewCard, PreviewCardPopup, PreviewCardTrigger } from "@/registry/default/ui/preview-card"

export default function PreviewCardProduct() {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={<Button variant="outline" />}>View plan</PreviewCardTrigger>
      <PreviewCardPopup>
        <div className="grid gap-2">
          <Badge className="w-fit">Pro</Badge>
          <div className="font-medium">Automation plan</div>
          <p className="text-sm text-muted-foreground">Unlimited workflows with 30-day history.</p>
        </div>
      </PreviewCardPopup>
    </PreviewCard>
  )
}
