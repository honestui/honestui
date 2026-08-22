"use client";

import * as React from "react";
import { LoaderCircle as LoaderCircleIcon } from "honestui/icons";

import { Button } from "@/registry/default/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog";
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";

export default function DialogFormSubmit() {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && saving) {
      return;
    }
    setOpen(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setOpen(false);
    }, 1200);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="secondary" />}>
        Invite member
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            They receive an email invitation for the Aurora workspace.
          </DialogDescription>
        </DialogHeader>
        <Form onSubmit={handleSubmit} className="grid">
          <DialogBody>
            <Field>
              <FieldLabel>Email address</FieldLabel>
              <FieldControl
                name="email"
                type="email"
                placeholder="teammate@example.com"
                required
                disabled={saving}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />} disabled={saving}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : null}
              Send invite
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
