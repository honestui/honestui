import Link from "next/link";
import { Check, Plus, Trash } from "honestui/icons";

import { Button } from "@/registry/default/ui/button";

export default function ButtonDemo() {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button>
          <Check aria-hidden="true" />
          Publish
        </Button>
        <Button variant="secondary">Save draft</Button>
        <Button variant="outline">Preview</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="destructive">
          <Trash aria-hidden="true" />
          Delete
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Add item">
          <Plus aria-hidden="true" />
        </Button>
        <Button disabled>Unavailable</Button>
        <Button render={<Link href="/docs/get-started" />}>Get started</Button>
      </div>
    </div>
  );
}
