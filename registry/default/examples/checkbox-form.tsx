"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import { Checkbox } from "@/registry/default/ui/checkbox";
import { Field, FieldLabel } from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";

export default function CheckboxFormDemo() {
  const [status, setStatus] = React.useState("");
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStatus(
      formData.has("terms")
        ? "Submitted: terms accepted."
        : "Submitted: terms not accepted.",
    );
  };
  return (
    <Form onSubmit={onSubmit} className="grid w-auto gap-4">
      <Field name="terms">
        <FieldLabel>
          <Checkbox name="terms" value="yes" defaultChecked />
          Accept terms and conditions
        </FieldLabel>
      </Field>
      <Button type="submit">Accept terms</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </Form>
  );
}
