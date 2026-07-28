import { Button } from "@/registry/default/ui/button"
import { Popover, PopoverDescription, PopoverPopup, PopoverTitle, PopoverTrigger } from "@/registry/default/ui/popover"

export default function PopoverAccountSummary() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Account</PopoverTrigger>
      <PopoverPopup className="w-72">
        <PopoverTitle>Acme workspace</PopoverTitle>
        <PopoverDescription>12 members, 4 active projects, and 84% storage used.</PopoverDescription>
      </PopoverPopup>
    </Popover>
  )
}
