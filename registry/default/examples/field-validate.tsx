import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldHelperSlot,
  FieldLabel,
} from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"

const RESERVED_NAMES = ["admin", "root", "support"]

export default function FieldValidate() {
  return (
    <Form className="w-full max-w-xs">
      <Field
        name="username"
        validationMode="onBlur"
        validate={(value) => {
          const username = String(value ?? "").toLowerCase()
          if (RESERVED_NAMES.includes(username)) {
            return "That username is reserved. Try another."
          }
          return null
        }}
      >
        <FieldLabel>Username</FieldLabel>
        <FieldControl minLength={3} placeholder="e.g. aurora-dev" />
        <FieldHelperSlot>
          <FieldDescription>
            At least 3 characters. Names like “admin” are taken.
          </FieldDescription>
          <FieldError />
        </FieldHelperSlot>
      </Field>
    </Form>
  )
}
