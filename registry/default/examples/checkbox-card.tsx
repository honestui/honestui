import { Checkbox } from "@/registry/default/ui/checkbox"
import { Label } from "@/registry/default/ui/label"

export default function CheckboxCardDemo() {
  return (
    <Label className="flex items-start gap-2 rounded-sm border-[0.5px] p-3 transition-colors hover:bg-accent/50 has-data-checked:border-[var(--hui-color-border-accent-emphasis)] has-data-checked:bg-[var(--hui-accent-2)]">
      <Checkbox defaultChecked />
      <div className="flex flex-col gap-1">
        <p className="text-sm leading-4">Enable notifications</p>
        <p className="text-xs text-muted-foreground">
          You can enable or disable notifications at any time.
        </p>
      </div>
    </Label>
  )
}
