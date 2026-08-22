"use client";

import * as React from "react";
import { LoaderCircle as LoaderCircleIcon } from "honestui/icons";

import { Button } from "@/registry/default/ui/button";
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";

const TAKEN_USERNAMES = ["admin", "support", "root"];

type ServerErrors = Partial<Record<"username", string>>;

async function submitUsername(username: string): Promise<ServerErrors> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (TAKEN_USERNAMES.includes(username.toLowerCase())) {
    return { username: `${username} is already taken. Try another one.` };
  }
  return {};
}

export default function FormServerError() {
  const [errors, setErrors] = React.useState<ServerErrors>({});
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    setErrors({});
    setPending(true);
    const serverErrors = await submitUsername(username);
    setErrors(serverErrors);
    setPending(false);
    setStatus(
      serverErrors.username
        ? "The name was rejected. Pick another and resubmit."
        : `Reserved ${username}.`,
    );
  };

  return (
    <Form onSubmit={onSubmit} className="grid w-full max-w-64 gap-4">
      <Field invalid={Boolean(errors.username)}>
        <FieldLabel>Username</FieldLabel>
        <FieldControl
          name="username"
          placeholder="ada"
          autoComplete="off"
          onChange={() => {
            setErrors((current) =>
              current.username ? {} : current
            );
          }}
        />
        <FieldError>{errors.username}</FieldError>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending && (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        )}
        Reserve username
      </Button>
      <p aria-live="polite" className="min-h-[var(--hui-space-5)] text-[length:var(--hui-font-size-mini)] text-[var(--hui-color-foreground-base-secondary)]">
        {status}
      </p>
    </Form>
  );
}
