"use client";

import { useState } from "react";

import { PullToRefresh } from "@/registry/default/animated/pull-to-refresh";

export default function PullToRefreshDemo() {
  const [updatedAt, setUpdatedAt] = useState("just now");

  return (
    <PullToRefresh
      onRefresh={async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        setUpdatedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }}
      className="h-72 w-full max-w-sm overflow-hidden rounded-2xl border bg-card"
      contentClassName="min-h-full p-5"
    >
      <p className="font-medium">Activity</p>
      <p className="text-muted-foreground mt-1 text-sm">Pull down from the top of this card to refresh.</p>
      <div className="mt-6 space-y-3">
        {["Design review completed", "New comment on Motion", "Build passed"].map((item) => (
          <div key={item} className="rounded-xl bg-muted px-4 py-3 text-sm">{item}</div>
        ))}
      </div>
      <p className="text-muted-foreground mt-4 text-xs">Updated {updatedAt}</p>
    </PullToRefresh>
  );
}
