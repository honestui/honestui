"use client";

import * as React from "react";
import { LoaderCircle as LoaderCircleIcon } from "honestui/icons";

import { Button } from "@/registry/default/ui/button";

type SaveStatus = "idle" | "saving" | "saved";

export default function ButtonAsyncAction() {
  const [status, setStatus] = React.useState<SaveStatus>("idle");

  React.useEffect(() => {
    if (status !== "saving") {
      return;
    }
    const timeout = setTimeout(() => setStatus("saved"), 1500);
    return () => clearTimeout(timeout);
  }, [status]);

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        disabled={status === "saving"}
        onClick={() => setStatus("saving")}
      >
        {status === "saving" ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : null}
        Save changes
      </Button>
      <p
        aria-live="polite"
        className="min-h-[var(--hui-space-5)] text-[length:var(--hui-font-size-mini)] text-muted-foreground"
      >
        {status === "saving" ? "Saving…" : status === "saved" ? "Changes saved." : null}
      </p>
    </div>
  );
}
