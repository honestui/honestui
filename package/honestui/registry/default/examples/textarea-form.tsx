"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"
import { Textarea } from "@/registry/default/ui/textarea"

export default function TextareaForm() {
  const [loading, setLoading] = React.useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    alert(`Message: ${formData.get("message") || ""}`)
  }

  return (
    <Form onSubmit={onSubmit} className="grid max-w-64 gap-4">
      <Field>
        <FieldLabel>Message</FieldLabel>
        <FieldControl
          name="message"
          placeholder="Type your message here"
          disabled={loading}
          required
          render={(props) => <Textarea {...props} />}
        />
        <FieldError>This field is required.</FieldError>
      </Field>
      <Button type="submit" disabled={loading}>
        Submit
      </Button>
    </Form>
  )
}
