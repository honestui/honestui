"use client"

import { Field, FieldLabel } from "@/registry/default/ui/field"
import {
  OTPField,
  OTPFieldGroup,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@/registry/default/ui/otp-field"

export default function OTPFieldGrouped() {
  return (
    <Field name="authenticatorCode" className="w-fit">
      <FieldLabel>Authenticator code</FieldLabel>
      <OTPField length={6}>
        <OTPFieldGroup>
          <OTPFieldInput />
          <OTPFieldInput aria-label="Character 2 of 6" />
          <OTPFieldInput aria-label="Character 3 of 6" />
        </OTPFieldGroup>
        <OTPFieldSeparator />
        <OTPFieldGroup>
          <OTPFieldInput aria-label="Character 4 of 6" />
          <OTPFieldInput aria-label="Character 5 of 6" />
          <OTPFieldInput aria-label="Character 6 of 6" />
        </OTPFieldGroup>
      </OTPField>
    </Field>
  )
}
