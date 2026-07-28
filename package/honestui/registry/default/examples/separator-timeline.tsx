import { Separator } from "@/registry/default/ui/separator"

export default function SeparatorTimeline() {
  return (
    <div className="flex h-24 items-center gap-4 text-sm">
      <div>Draft</div>
      <Separator orientation="vertical" />
      <div>Review</div>
      <Separator orientation="vertical" />
      <div>Publish</div>
    </div>
  )
}
