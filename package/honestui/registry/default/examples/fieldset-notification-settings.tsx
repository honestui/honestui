import { Checkbox } from "@/registry/default/ui/checkbox"
import { Field, FieldLabel } from "@/registry/default/ui/field"
import { Fieldset, FieldsetLegend } from "@/registry/default/ui/fieldset"

export default function FieldsetNotificationSettings() {
  return (
    <Fieldset className="max-w-sm rounded-xl border p-4">
      <FieldsetLegend>Notifications</FieldsetLegend>
      <Field><FieldLabel><Checkbox defaultChecked /> Product updates</FieldLabel></Field>
      <Field><FieldLabel><Checkbox /> Weekly digest</FieldLabel></Field>
      <Field><FieldLabel><Checkbox defaultChecked /> Security alerts</FieldLabel></Field>
    </Fieldset>
  )
}
