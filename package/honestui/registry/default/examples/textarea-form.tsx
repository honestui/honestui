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
import { Textarea } from "@/registry/default/ui/textarea";

export default function TextareaForm() {
  const [status, setStatus] = React.useState("");
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const message = String(formData.get("message") || "");
    setStatus(`Message ready to send (${message.length} characters).`);
  };

  return (
    <Form onSubmit={onSubmit} className="grid w-full max-w-64 gap-4">
      <Field>
        <FieldLabel>Message</FieldLabel>
        <FieldControl
          name="message"
          placeholder="Type your message here"
          required
          render={(props) => <Textarea {...props} />}
        />
        <FieldError>This field is required.</FieldError>
      </Field>
      <Button type="submit">Send message</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </Form>
  );
}
