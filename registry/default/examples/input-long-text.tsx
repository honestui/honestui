import { useId } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

const LONG_URL =
  "https://example.com/knowledge-base/articles/understanding-prorated-billing-for-annual-plan-upgrades";

export default function InputLongText() {
  const id = useId();

  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-2">
      <Label htmlFor={id}>Canonical URL</Label>
      <Input id={id} type="url" defaultValue={LONG_URL} />
    </div>
  );
}
