import { Separator } from "@/registry/default/ui/separator"

export default function SeparatorVerticalStack() {
  return (
    <div className="flex h-24 items-center rounded-xl border p-4 text-sm">
      <span>12 files</span>
      <Separator orientation="vertical" className="mx-4" />
      <span>4.8 MB</span>
      <Separator orientation="vertical" className="mx-4" />
      <span>Synced</span>
    </div>
  )
}
