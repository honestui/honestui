import { Switch } from "@/registry/default/ui/switch"
import { Field, FieldDescription, FieldLabel } from "@/registry/default/ui/field"
import { Fieldset, FieldsetLegend } from "@/registry/default/ui/fieldset"

export default function FieldsetDangerZone() {
  return (
    <Fieldset className="max-w-sm rounded-xl border border-destructive/30 p-4">
      <FieldsetLegend>Danger zone</FieldsetLegend>
      <Field>
        <FieldLabel className="justify-between w-full">Require delete confirmation <Switch /></FieldLabel>
        <FieldDescription>Ask for a typed confirmation before destructive actions.</FieldDescription>
      </Field>
    </Fieldset>
  )
}
