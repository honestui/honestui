import { Sparkles as SparklesIcon } from "honestui/icons"

import { Badge } from "@/registry/default/ui/badge"

export default function BadgeReleaseStatus() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        <SparklesIcon />
        New
      </Badge>
      <Badge variant="success">Live</Badge>
      <Badge variant="outline">v2.4.0</Badge>
    </div>
  )
}
