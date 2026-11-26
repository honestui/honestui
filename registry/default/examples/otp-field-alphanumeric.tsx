"use client"

import * as React from "react"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/registry/default/ui/field"
import {
  OTPField,
  OTPFieldGroup,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@/registry/default/ui/otp-field"

export default function OTPFieldAlphanumeric() {
  const [value, setValue] = React.useState("")

  return (
    <Field name="recoveryCode" className="w-fit">
      <FieldLabel>Recovery code</FieldLabel>
      <OTPField
        length={8}
        size="sm"
        validationType="alphanumeric"
        normalizeValue={(next) => next.toUpperCase()}
        value={value}
        onValueChange={setValue}
      >
        <OTPFieldGroup>
          <OTPFieldInput />
          <OTPFieldInput aria-label="Character 2 of 8" />
          <OTPFieldInput aria-label="Character 3 of 8" />
          <OTPFieldInput aria-label="Character 4 of 8" />
        </OTPFieldGroup>
        <OTPFieldSeparator />
        <OTPFieldGroup>
          <OTPFieldInput aria-label="Character 5 of 8" />
          <OTPFieldInput aria-label="Character 6 of 8" />
          <OTPFieldInput aria-label="Character 7 of 8" />
          <OTPFieldInput aria-label="Character 8 of 8" />
        </OTPFieldGroup>
      </OTPField>
      <FieldDescription>
        {value.length === 8
          ? `Ready to verify ${value.slice(0, 4)}-${value.slice(4)}.`
          : "Letters and numbers from one of your saved backup codes."}
      </FieldDescription>
    </Field>
  )
}
