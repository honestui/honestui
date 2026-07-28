import { Avatar, AvatarFallback, AvatarImage } from "@/registry/default/ui/avatar"
import { Button } from "@/registry/default/ui/button"
import { PreviewCard, PreviewCardPopup, PreviewCardTrigger } from "@/registry/default/ui/preview-card"

export default function PreviewCardProfile() {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={<Button variant="ghost" />}>Connor Love</PreviewCardTrigger>
      <PreviewCardPopup>
        <div className="flex gap-3">
          <Avatar><AvatarImage src="https://github.com/loveconnor" alt="Connor" /><AvatarFallback>CL</AvatarFallback></Avatar>
          <div><div className="font-medium">Connor Love</div><p className="text-sm text-muted-foreground">Designer & Developer</p></div>
        </div>
      </PreviewCardPopup>
    </PreviewCard>
  )
}
