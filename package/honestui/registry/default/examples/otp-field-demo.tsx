"use client"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/registry/default/ui/field"
import { OTPField } from "@/registry/default/ui/otp-field"

export default function OTPFieldDemo() {
  return (
    <Field name="verificationCode" className="w-fit">
      <FieldLabel>Verification code</FieldLabel>
      <OTPField length={6} />
      <FieldDescription>
        Enter the 6-digit code we sent to your phone ending in 0142.
      </FieldDescription>
    </Field>
  )
}
