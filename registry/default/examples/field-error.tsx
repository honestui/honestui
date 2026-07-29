import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "@/registry/default/ui/field"

export default function FieldWithErrorDemo() {
  return (
    <Field className="w-full max-w-64">
      <FieldLabel>Email</FieldLabel>
      <FieldControl type="email" placeholder="Enter your email" />
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  )
}
