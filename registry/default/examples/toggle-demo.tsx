import { Bold as BoldIcon, Italic as ItalicIcon } from "honestui/icons";

import { Toggle, ToggleGroup } from "@/registry/default/ui/toggle";

export default function ToggleDemo() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Toggle defaultPressed>Preview</Toggle>
        <Toggle size="sm">Compact</Toggle>
        <Toggle size="lg" variant="outline">
          Outline
        </Toggle>
        <Toggle disabled>Unavailable</Toggle>
      </div>
      <ToggleGroup
        defaultValue={["bold", "italic"]}
        multiple
        aria-label="Text formatting"
      >
        <Toggle value="bold" aria-label="Bold">
          <BoldIcon aria-hidden="true" />
        </Toggle>
        <Toggle value="italic" aria-label="Italic">
          <ItalicIcon aria-hidden="true" />
        </Toggle>
      </ToggleGroup>
    </div>
  );
}
