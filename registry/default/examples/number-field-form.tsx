"use client";

import * as React from "react";
import { z } from "zod";

import { Button } from "@/registry/default/ui/button";
import { Field } from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@/registry/default/ui/number-field";

const schema = z.object({
  quantity: z.coerce
    .number({ message: "Please enter a quantity." })
    .min(1, { message: "Quantity must be at least 1." })
    .max(100, { message: "Maximum quantity is 100." }),
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
    data: result.data,
  };
}

export default function NumberFieldFormDemo() {
  const [status, setStatus] = React.useState("");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const response = validateForm(event);
    if (Object.keys(response.errors).length === 0) {
      setStatus(`Validated quantity: ${response.data?.quantity}.`);
    } else {
      setStatus(String(response.errors.quantity || "Check the quantity."));
    }
  };

  return (
    <Form onSubmit={onSubmit} className="grid w-full max-w-64 gap-4">
      <Field name="quantity">
        <NumberField defaultValue={1} min={1} max={100}>
          <NumberFieldScrubArea label="Quantity" />
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
      </Field>

      <Button type="submit">Save quantity</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </Form>
  );
}
