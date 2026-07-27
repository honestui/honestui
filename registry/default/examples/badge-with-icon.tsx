import { Check as CheckIcon } from "love-ui/icons"

import { Badge } from "@/registry/default/ui/badge"

export default function BadgeWithIcon() {
  return (
    <Badge variant="outline">
      <CheckIcon />
      Verified
    </Badge>
  )
}
