import { ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"

export default function ButtonSecondaryIcons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary">
        <ArrowLeftIcon />
        Previous
      </Button>
      <Button variant="secondary">
        Next
        <ArrowRightIcon />
      </Button>
    </div>
  )
}
