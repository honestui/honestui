"use client";

import * as React from "react";
import { z } from "zod";

import { Button } from "@/registry/default/ui/button";
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";

const schema = z.object({
  name: z.string().min(1, { message: "Please enter a name." }),
  age: z.coerce
    .number({ message: "Please enter a number." })
    .positive({ message: "Number must be positive." }),
});

type Errors = Record<string, string | string[]>;

function validateForm(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const result = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    return { errors: fieldErrors as Errors };
  }

  return {
    errors: {} as Errors,
  };
}

export default function FormZodDemo() {
  const [errors, setErrors] = React.useState<Errors>({});
  const [status, setStatus] = React.useState("");
  const clearError = (name: string) => {
    setErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const response = validateForm(event);
    setErrors(response.errors);
    if (Object.keys(response.errors).length === 0) {
      setStatus("Details are valid and ready to submit.");
    } else {
      setStatus("Check the highlighted fields.");
    }
  };

  return (
    <Form className="grid max-w-64 gap-4" onSubmit={onSubmit}>
      <Field name="name" invalid={Boolean(errors.name)}>
        <FieldLabel>Name</FieldLabel>
        <FieldControl
          placeholder="Enter name"
          onChange={() => {
            clearError("name");
            setStatus("");
          }}
        />
        <FieldError>{errors.name?.[0]}</FieldError>
      </Field>
      <Field name="age" invalid={Boolean(errors.age)}>
        <FieldLabel>Age</FieldLabel>
        <FieldControl
          placeholder="Enter age"
          onChange={() => {
            clearError("age");
            setStatus("");
          }}
        />
        <FieldError>{errors.age?.[0]}</FieldError>
      </Field>
      <Button type="submit">Validate details</Button>
      <p
        aria-live="polite"
        className="min-h-[var(--hui-space-5)] text-[length:var(--hui-font-size-mini)] text-[var(--hui-color-foreground-base-secondary)]"
      >
        {status}
      </p>
    </Form>
  );
}
