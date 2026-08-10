"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";

export default function FormDemo() {
  const [savedEmail, setSavedEmail] = React.useState("");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSavedEmail(String(formData.get("email") ?? ""));
  };

  return (
    <Form onSubmit={onSubmit} className="grid w-full max-w-64 gap-4">
      <Field>
        <FieldLabel>Email address</FieldLabel>
        <FieldControl
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
        <FieldError>
          Enter an email address in the format name@example.com.
        </FieldError>
      </Field>
      <Button type="submit">Save email address</Button>
      <p
        aria-live="polite"
        className="min-h-[var(--hui-space-5)] text-[length:var(--hui-font-size-mini)] text-[var(--hui-color-foreground-success-primary)]"
      >
        {savedEmail ? `Submitted email: ${savedEmail}.` : null}
      </p>
    </Form>
  );
}
