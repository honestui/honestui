import { Separator } from "@/registry/default/ui/separator"

export default function SeparatorSectionLabel() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="text-sm font-medium">Account</div>
      <Separator />
      <p className="text-sm text-muted-foreground">Profile, security, and billing settings.</p>
    </div>
  )
}
