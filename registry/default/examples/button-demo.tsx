import { Button } from "@/registry/default/ui/button"
import { Check } from "honestui/icons"

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="destructive">Delete project</Button>
      <Button variant="secondary">Stage for publish</Button>
      <Button>
        <Check data-icon />
        Publish now
      </Button>
    </div>
  )
}
