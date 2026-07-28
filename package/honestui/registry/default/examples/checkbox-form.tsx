"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { Checkbox } from "@/registry/default/ui/checkbox"
import { Field, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"

export default function CheckboxFormDemo() {
  const [loading, setLoading] = React.useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    const accepted = formData.get("terms")
    alert(`Terms: ${accepted}`)
  }
  return (
    <Form onSubmit={onSubmit} className="grid w-auto gap-4">
      <Field name="terms">
        <FieldLabel>
          <Checkbox
            name="terms"
            value="yes"
            defaultChecked
            disabled={loading}
          />
          Accept terms and conditions
        </FieldLabel>
      </Field>
      <Button type="submit" disabled={loading}>
        Submit
      </Button>
    </Form>
  )
}
