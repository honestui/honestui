"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";
import { Slider, SliderValue } from "@/registry/default/ui/slider";

export default function SliderForm() {
  const [status, setStatus] = React.useState("");
  const [value, setValue] = React.useState<number | readonly number[]>([
    25, 75,
  ]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const volumes = formData.getAll("volume");
    setStatus(`Submitted volume range: ${volumes.join(" to ")}.`);
  };

  return (
    <Form onSubmit={onSubmit} className="w-full max-w-64 grid gap-4">
      <Field name="volume" className="items-stretch gap-3">
        <Slider value={value} onValueChange={setValue}>
          <div className="mb-2 flex items-center justify-between gap-1">
            <FieldLabel>Volume</FieldLabel>
            <SliderValue />
          </div>
        </Slider>
        <FieldDescription>Choose a value between 0 and 100.</FieldDescription>
      </Field>
      <Button type="submit">Save volume</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </Form>
  );
}
