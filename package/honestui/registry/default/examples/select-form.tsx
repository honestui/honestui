"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldHelperSlot,
  FieldLabel,
} from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select";

const items = [
  { label: "Select a framework", value: null },
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Astro", value: "astro" },
];

export default function SelectForm() {
  const [status, setStatus] = React.useState("");
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStatus(`Submitted framework: ${formData.get("framework")}.`);
  };

  return (
    <Form onSubmit={onSubmit} className="grid w-full max-w-64 gap-4">
      <Field>
        <FieldLabel>Framework</FieldLabel>
        <Select name="framework" items={items} required>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {items.map(({ label, value }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <FieldHelperSlot>
          <FieldDescription>
            Choose the framework used by this project.
          </FieldDescription>
          <FieldError>Select a framework.</FieldError>
        </FieldHelperSlot>
      </Field>

      <Button type="submit">Save framework</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </Form>
  );
}
