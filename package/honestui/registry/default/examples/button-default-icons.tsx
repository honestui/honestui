import { ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"

export default function ButtonDefaultIcons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <ArrowLeftIcon />
        Previous
      </Button>
      <Button>
        Next
        <ArrowRightIcon />
      </Button>
    </div>
  )
}
