"use client";

import * as React from "react";
import { Ellipsis as MoreIcon } from "honestui/icons";

import { Button } from "@/registry/default/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/registry/default/ui/card";
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select";

const frameworkOptions = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
];

export default function CardDemo() {
  const [status, setStatus] = React.useState("");

  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>
          Choose a name and framework. You can change both later.
        </CardDescription>
        <CardAction>
          <Button
            aria-label="More project options"
            size="icon-sm"
            variant="ghost"
          >
            <MoreIcon aria-hidden="true" />
          </Button>
        </CardAction>
      </CardHeader>
      <Form
        className="grid gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          setStatus("Project details are ready to deploy.");
        }}
      >
        <CardPanel>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldControl type="text" placeholder="Name of your project" />
            </Field>
            <Field>
              <FieldLabel>Framework</FieldLabel>
              <Select items={frameworkOptions} defaultValue="next">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {frameworkOptions.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
          </div>
        </CardPanel>
        <CardFooter>
          <div className="grid w-full gap-3">
            <Button className="w-full" type="submit">
              Review project
            </Button>
            <p className="text-sm text-muted-foreground" role="status">
              {status}
            </p>
          </div>
        </CardFooter>
      </Form>
    </Card>
  );
}
