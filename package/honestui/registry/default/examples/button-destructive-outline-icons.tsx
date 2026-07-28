import { ArrowRight as ArrowRightIcon, Trash as TrashIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"

export default function ButtonDestructiveOutlineIcons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="destructive-outline">
        <TrashIcon />
        Delete
      </Button>
      <Button variant="destructive-outline">
        Delete
        <ArrowRightIcon />
      </Button>
    </div>
  )
}
