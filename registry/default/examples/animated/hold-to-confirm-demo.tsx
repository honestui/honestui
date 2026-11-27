"use client";

import { useState } from "react";
import { HoldToConfirm } from "@/registry/default/animated/hold-to-confirm";

export default function HoldToConfirmDemo() {
  const [deleted, setDeleted] = useState(0);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-medium text-foreground">Delete project</p>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
          Removes the project, its deployments, and 14 environment variables. This cannot be undone.
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {deleted > 0 ? `Deleted ${deleted} ${deleted === 1 ? "time" : "times"} in this demo` : "Press and hold"}
          </span>
          <HoldToConfirm
            variant="destructive"
            holdLabel="Keep holding…"
            confirmedLabel="Deleted"
            onConfirm={() => setDeleted((count) => count + 1)}
          >
            Delete project
          </HoldToConfirm>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <HoldToConfirm size="sm" confirmedLabel="Archived">
          Archive
        </HoldToConfirm>
        <HoldToConfirm duration={2000} holdLabel="Publishing…" confirmedLabel="Published">
          Publish to production
        </HoldToConfirm>
      </div>
    </div>
  );
}
