"use client";

import * as React from "react";
import { Trash as TrashIcon } from "honestui/icons";

import { Button } from "@/registry/default/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog";

export default function DialogDestructiveConfirm() {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>
          <TrashIcon aria-hidden="true" />
          Delete project
        </DialogTrigger>
        <DialogPopup initialFocus={cancelRef} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete “Aurora website”?</DialogTitle>
            <DialogDescription>
              The project, its deployments, and its environment variables are
              permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="ghost" ref={cancelRef} />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleted(true);
                setOpen(false);
              }}
            >
              Delete project
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      <p
        aria-live="polite"
        className="min-h-[var(--hui-space-5)] text-[length:var(--hui-font-size-mini)] text-muted-foreground"
      >
        {deleted ? "Project deleted." : null}
      </p>
    </div>
  );
}
