"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";

export default function ButtonFormSubmit() {
  const [submittedName, setSubmittedName] = React.useState("");

  return (
    <Form
      className="grid w-full max-w-64 gap-4"
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setSubmittedName(String(formData.get("name") ?? ""));
      }}
    >
      <Field>
        <FieldLabel>Display name</FieldLabel>
        <FieldControl name="name" placeholder="Ada Lovelace" required />
      </Field>
      <div className="flex gap-3">
        <Button type="submit">Create profile</Button>
        <Button variant="ghost">Cancel</Button>
      </div>
      <p
        aria-live="polite"
        className="min-h-[var(--hui-space-5)] text-[length:var(--hui-font-size-mini)] text-muted-foreground"
      >
        {submittedName
          ? `Created profile for ${submittedName}.`
          : "Submit with the button or by pressing Enter in the field."}
      </p>
    </Form>
  );
}
