import Link from "next/link";
import { Check as CheckIcon } from "honestui/icons";

import { Badge } from "@/registry/default/ui/badge";

export default function BadgeDemo() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Default</Badge>
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="success">
          <CheckIcon aria-hidden="true" />
          Ready
        </Badge>
        <Badge variant="warning">Needs review</Badge>
        <Badge variant="error">Failed</Badge>
        <Badge variant="gradient">Experimental</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm">Small</Badge>
        <Badge>Default</Badge>
        <Badge size="lg">Large</Badge>
        <Badge
          render={<Link href="/docs/components/badge" />}
          variant="outline"
        >
          Badge docs
        </Badge>
      </div>
    </div>
  );
}
