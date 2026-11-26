"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"
import { OTPField } from "@/registry/default/ui/otp-field"

// The only code this example accepts.
const EXPECTED_CODE = "246810"

export default function OTPFieldInvalid() {
  const [error, setError] = React.useState(
    "That code didn’t match. Check the latest email and try again."
  )
  const [verified, setVerified] = React.useState(false)

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = String(new FormData(event.currentTarget).get("loginCode") ?? "")
    const matches = code === EXPECTED_CODE
    setVerified(matches)
    setError(
      matches
        ? ""
        : "That code didn’t match. Check the latest email and try again."
    )
  }

  return (
    <Form onSubmit={onSubmit} className="grid w-fit gap-[var(--hui-space-4)]">
      <Field name="loginCode" invalid={Boolean(error)}>
        <FieldLabel>Sign-in code</FieldLabel>
        <OTPField
          length={6}
          mask
          defaultValue="135790"
          onValueChange={() => setError("")}
        />
        <FieldError>{error}</FieldError>
        <FieldDescription aria-live="polite">
          {verified
            ? "Code verified. You’re signed in."
            : `Enter ${EXPECTED_CODE} to see the verified state.`}
        </FieldDescription>
      </Field>
      <Button type="submit" className="w-full">
        Verify
      </Button>
    </Form>
  )
}
