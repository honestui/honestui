import { Input } from "@/registry/default/ui/input"

export default function InputSm() {
  return (
    <Input className="w-full max-w-64"
      size="sm"
      placeholder="Enter text"
      aria-label="Enter text"
    />
  )
}
