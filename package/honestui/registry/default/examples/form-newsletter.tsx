import { Button } from "@/registry/default/ui/button"
import { Field, FieldControl, FieldDescription, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"

export default function FormNewsletter() {
  return (
    <Form className="grid w-full max-w-sm gap-4 rounded-xl border p-4">
      <Field>
        <FieldLabel>Newsletter</FieldLabel>
        <FieldControl type="email" placeholder="you@example.com" />
        <FieldDescription>One concise product email each Friday.</FieldDescription>
      </Field>
      <Button type="submit">Subscribe</Button>
    </Form>
  )
}
