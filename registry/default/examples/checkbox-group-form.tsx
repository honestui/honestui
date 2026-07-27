"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { Checkbox } from "@/registry/default/ui/checkbox"
import { CheckboxGroup } from "@/registry/default/ui/checkbox"
import { Field, FieldLabel } from "@/registry/default/ui/field"
import { Fieldset, FieldsetLegend } from "@/registry/default/ui/fieldset"
import { Form } from "@/registry/default/ui/form"

export default function CheckboxGroupFormDemo() {
  const [loading, setLoading] = React.useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    const frameworks = formData.getAll("frameworks") as string[]
    alert(`Selected: ${frameworks.join(", ") || "none"}`)
  }

  return (
    <Form onSubmit={onSubmit} className="grid max-w-[160px] gap-4">
      <Field
        name="frameworks"
        className="gap-4"
        render={(props) => <Fieldset {...props} />}
      >
        <FieldsetLegend className="text-sm font-medium">
          Frameworks
        </FieldsetLegend>
        <CheckboxGroup defaultValue={["next"]} disabled={loading}>
          <FieldLabel>
            <Checkbox value="next" />
            Next.js
          </FieldLabel>
          <FieldLabel>
            <Checkbox value="vite" />
            Vite
          </FieldLabel>
          <FieldLabel>
            <Checkbox value="astro" />
            Astro
          </FieldLabel>
        </CheckboxGroup>
      </Field>
      <Button type="submit" disabled={loading}>
        Submit
      </Button>
    </Form>
  )
}
