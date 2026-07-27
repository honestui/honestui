import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"

export default function LabelPasswordField() {
  return (
    <div className="grid w-full max-w-xs gap-2">
      <Label htmlFor="label-password-field">Password</Label>
      <Input id="label-password-field" type="password" placeholder="********" />
    </div>
  )
}
