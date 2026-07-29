import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "@/registry/default/ui/field"

export default function FieldRequiredDemo() {
  return (
    <Field className="w-full max-w-64">
      <FieldLabel>
        Password <span className="text-destructive-foreground">*</span>
      </FieldLabel>
      <FieldControl
        type="password"
        placeholder="Enter password"
        required
      />
      <FieldError>Please fill out this field.</FieldError>
    </Field>
  )
}
