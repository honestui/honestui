import { useId } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function InputStates() {
  const readOnlyId = useId();
  const disabledId = useId();

  return (
    <div className="grid w-full max-w-64 gap-4">
      <div className="flex flex-col items-start gap-2">
        <Label htmlFor={readOnlyId}>Workspace slug (read-only)</Label>
        <Input id={readOnlyId} defaultValue="aurora-production" readOnly />
      </div>
      <div className="flex flex-col items-start gap-2">
        <Label htmlFor={disabledId}>Seat count (unavailable)</Label>
        <Input id={disabledId} defaultValue="24" disabled />
      </div>
    </div>
  );
}
