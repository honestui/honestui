import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@/registry/default/ui/field"

export default function FieldDemo() {
  return (
    <Field className="w-full max-w-64">
      <FieldLabel>Name</FieldLabel>
      <FieldControl type="text" placeholder="Enter your name" />
      <FieldDescription>Visible on your profile</FieldDescription>
    </Field>
  )
}
