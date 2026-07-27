import { ArrowRight as ArrowRightIcon, Trash as TrashIcon } from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"

export default function ButtonDestructiveIcons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="destructive">
        <TrashIcon />
        Delete
      </Button>
      <Button variant="destructive">
        Delete
        <ArrowRightIcon />
      </Button>
    </div>
  )
}
