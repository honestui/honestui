import { Field, FieldControl, FieldDescription, FieldLabel } from "@/registry/default/ui/field"

export default function FieldPassword() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Password</FieldLabel>
      <FieldControl type="password" placeholder="********" />
      <FieldDescription>Use at least 12 characters.</FieldDescription>
    </Field>
  )
}
