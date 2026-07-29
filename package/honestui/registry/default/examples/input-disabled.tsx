import { Input } from "@/registry/default/ui/input"

export default function InputDisabled() {
  return (
    <Input className="w-full max-w-64"
      placeholder="Disabled"
      disabled
      aria-label="Disabled"
    />
  )
}
