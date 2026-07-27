import { LoaderCircle as LoaderCircleIcon } from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"

export default function ButtonLoading() {
  return (
    <Button disabled>
      <LoaderCircleIcon className="animate-spin" />
      Loading...
    </Button>
  )
}
