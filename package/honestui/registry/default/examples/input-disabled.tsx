import { Input } from "@/registry/default/ui/input"

export default function InputDisabled() {
  return (
    <Input
      placeholder="Disabled"
      disabled
      aria-label="Disabled"
    />
  )
}
