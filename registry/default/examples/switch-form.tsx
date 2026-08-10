"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import { Field, FieldLabel } from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";
import { Switch } from "@/registry/default/ui/switch";

export default function SwitchFormDemo() {
  const [status, setStatus] = React.useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const enabled = formData.has("marketing");
    setStatus(
      `Submitted preference: marketing emails ${enabled ? "enabled" : "disabled"}.`,
    );
  };

  return (
    <Form onSubmit={onSubmit} className="grid w-auto gap-4">
      <Field name="marketing">
        <FieldLabel>
          <Switch name="marketing" defaultChecked />
          Enable marketing emails
        </FieldLabel>
      </Field>
      <Button type="submit">Save preference</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </Form>
  );
}
