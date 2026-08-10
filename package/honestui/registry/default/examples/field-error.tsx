import { Button } from "@/registry/default/ui/button";
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";

export default function FieldWithErrorDemo() {
  return (
    <Form className="grid w-full max-w-64 gap-[var(--hui-space-4)]">
      <Field name="email">
        <FieldLabel>Email address</FieldLabel>
        <FieldControl
          type="email"
          defaultValue="name@"
          placeholder="name@example.com"
          required
        />
        <FieldError>
          Enter an email address in the format name@example.com.
        </FieldError>
      </Field>
      <Button type="submit">Validate email</Button>
    </Form>
  );
}
