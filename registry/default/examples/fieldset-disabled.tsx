import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@/registry/default/ui/field"
import { Fieldset, FieldsetLegend } from "@/registry/default/ui/fieldset"

export default function FieldsetDisabled() {
  return (
    <Fieldset disabled className="max-w-sm rounded-xl border p-4">
      <FieldsetLegend>Billing details</FieldsetLegend>
      <Field>
        <FieldLabel>Company</FieldLabel>
        <FieldControl defaultValue="Acme Inc." />
        <FieldDescription>
          Locked while the workspace plan is paused.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Tax ID</FieldLabel>
        <FieldControl defaultValue="US-123456789" />
      </Field>
    </Fieldset>
  )
}
