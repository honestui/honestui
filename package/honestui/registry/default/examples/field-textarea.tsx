"use client"

import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@/registry/default/ui/field"
import { Textarea } from "@/registry/default/ui/textarea"

export default function FieldTextareaDemo() {
  return (
    <Field className="w-full max-w-64">
      <FieldLabel>Bio</FieldLabel>
      <FieldControl
        render={(props) => (
          <Textarea placeholder="Tell us about yourself…" {...props} />
        )}
      />
      <FieldDescription>
        Write a short bio. Maximum 500 characters.
      </FieldDescription>
    </Field>
  )
}
