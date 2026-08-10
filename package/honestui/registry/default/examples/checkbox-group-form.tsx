"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import { Checkbox } from "@/registry/default/ui/checkbox";
import { CheckboxGroup } from "@/registry/default/ui/checkbox";
import { Field, FieldLabel } from "@/registry/default/ui/field";
import { Fieldset, FieldsetLegend } from "@/registry/default/ui/fieldset";
import { Form } from "@/registry/default/ui/form";

export default function CheckboxGroupFormDemo() {
  const [status, setStatus] = React.useState("");
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const frameworks = formData.getAll("frameworks") as string[];
    setStatus(`Submitted: ${frameworks.join(", ") || "no frameworks"}.`);
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
        <CheckboxGroup defaultValue={["next"]}>
          <FieldLabel>
            <Checkbox value="next" />
            Next.js
          </FieldLabel>
          <FieldLabel>
            <Checkbox value="vite" />
            Vite
          </FieldLabel>
          <FieldLabel>
            <Checkbox value="astro" />
            Astro
          </FieldLabel>
        </CheckboxGroup>
      </Field>
      <Button type="submit">Save frameworks</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </Form>
  );
}
