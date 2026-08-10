"use client";

import * as React from "react";

import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldHelperSlot,
  FieldLabel,
  FieldSeparator,
} from "@/registry/default/ui/field";

export default function FieldDemo() {
  const [email, setEmail] = React.useState("name@");

  return (
    <FieldGroup className="w-full max-w-xs">
      <Field>
        <FieldLabel>Name</FieldLabel>
        <FieldControl name="name" placeholder="Enter your name" />
        <FieldDescription>Visible on your public profile.</FieldDescription>
      </Field>
      <FieldSeparator>Contact</FieldSeparator>
      <Field invalid={!email.includes("@example.com")}>
        <FieldLabel>Email</FieldLabel>
        <FieldControl
          aria-invalid={!email.includes("@example.com")}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
        <FieldHelperSlot>
          <FieldDescription>Use your example.com address.</FieldDescription>
          <FieldError>Enter an example.com email address.</FieldError>
        </FieldHelperSlot>
      </Field>
    </FieldGroup>
  );
}
