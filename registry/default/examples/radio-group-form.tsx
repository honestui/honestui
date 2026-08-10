"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import { Field, FieldLabel } from "@/registry/default/ui/field";
import { Fieldset, FieldsetLegend } from "@/registry/default/ui/fieldset";
import { Form } from "@/registry/default/ui/form";
import { Radio, RadioGroup } from "@/registry/default/ui/radio-group";

export default function RadioGroupFormDemo() {
  const [status, setStatus] = React.useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStatus(`Submitted framework: ${formData.get("frameworks")}.`);
  };

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
        <RadioGroup defaultValue="next">
          <FieldLabel>
            <Radio value="next" /> Next.js
          </FieldLabel>
          <FieldLabel>
            <Radio value="vite" /> Vite
          </FieldLabel>
          <FieldLabel>
            <Radio value="astro" /> Astro
          </FieldLabel>
        </RadioGroup>
      </Field>
      <Button type="submit">Save framework</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </Form>
  );
}
