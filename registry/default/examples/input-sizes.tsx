import { useId } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function InputSizes() {
  const smId = useId();
  const defaultId = useId();
  const lgId = useId();

  return (
    <div className="grid w-full max-w-64 gap-4">
      <div className="flex flex-col items-start gap-2">
        <Label htmlFor={smId}>Small</Label>
        <Input id={smId} size="sm" placeholder="Enter text" />
      </div>
      <div className="flex flex-col items-start gap-2">
        <Label htmlFor={defaultId}>Default</Label>
        <Input id={defaultId} placeholder="Enter text" />
      </div>
      <div className="flex flex-col items-start gap-2">
        <Label htmlFor={lgId}>Large</Label>
        <Input id={lgId} size="lg" placeholder="Enter text" />
      </div>
    </div>
  );
}
