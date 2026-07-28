import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Fieldset, FieldsetLegend } from "@/registry/default/ui/fieldset"

export default function FieldsetBillingAddress() {
  return (
    <Fieldset className="max-w-sm rounded-xl border p-4">
      <FieldsetLegend>Billing address</FieldsetLegend>
      <Field><FieldLabel>Company</FieldLabel><FieldControl defaultValue="Acme Inc." /></Field>
      <Field><FieldLabel>ZIP code</FieldLabel><FieldControl defaultValue="94107" /></Field>
    </Fieldset>
  )
}
