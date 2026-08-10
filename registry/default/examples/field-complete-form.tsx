"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import { Checkbox } from "@/registry/default/ui/checkbox";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
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

export default function FieldCompleteFormDemo() {
  const [status, setStatus] = React.useState("");
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      role: formData.get("role"),
      newsletter: formData.get("newsletter"),
    };
    setStatus(
      `Submitted ${data.fullName} (${data.email})${
        data.role ? ` as ${data.role}` : ""
      }. Newsletter ${data.newsletter ? "enabled" : "disabled"}.`,
    );
  };
  return (
    <Form onSubmit={onSubmit} className="w-full max-w-64 grid gap-4">
      <Field>
        <FieldLabel>
          Full name <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldControl
          name="fullName"
          type="text"
          placeholder="John Doe"
          required
        />
        <FieldError>Please enter a valid name.</FieldError>
      </Field>

      <Field>
        <FieldLabel>
          Email address <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldControl
          name="email"
          type="email"
          placeholder="john@example.com"
          required
        />
        <FieldError>Please enter a valid email.</FieldError>
      </Field>

      <Field>
        <FieldLabel>Role</FieldLabel>
        <Select
          name="role"
          items={[
            { label: "Select your role", value: null },
            { label: "Developer", value: "developer" },
            { label: "Designer", value: "designer" },
            { label: "Product Manager", value: "manager" },
            { label: "Other", value: "other" },
          ]}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="designer">Designer</SelectItem>
            <SelectItem value="manager">Product Manager</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectPopup>
        </Select>
        <FieldDescription>This field is optional.</FieldDescription>
      </Field>

      <Field>
        <div className="flex items-center gap-2">
          <Checkbox name="newsletter" />
          <FieldLabel className="cursor-pointer">
            Subscribe to newsletter
          </FieldLabel>
        </div>
      </Field>

      <Button type="submit">Save profile</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </Form>
  );
}
