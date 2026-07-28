"use client";

import { useState } from "react";

import { PullToRefresh } from "@/registry/default/animated/pull-to-refresh";

export default function PullToRefreshDemo() {
  const [updatedAt, setUpdatedAt] = useState("moments ago");

  return (
    <PullToRefresh
      pullingLabel="Pull for updates"
      releaseLabel="Release to check"
      refreshingLabel="Checking for updates"
      ariaLabel="Team updates"
      onRefresh={async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        setUpdatedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }}
      className="h-72 w-full max-w-sm overflow-hidden rounded-2xl border bg-card"
      contentClassName="min-h-full p-5"
    >
      <p className="font-medium">Team updates</p>
      <p className="text-muted-foreground mt-1 text-sm">Drag down from the top to check for new activity.</p>
      <div className="mt-6 space-y-3">
        {["Brief approved", "Jordan added a note", "Preview deployed"].map((item) => (
          <div key={item} className="rounded-xl bg-muted px-4 py-3 text-sm">{item}</div>
        ))}
      </div>
      <p className="text-muted-foreground mt-4 text-xs">Last synced {updatedAt}</p>
    </PullToRefresh>
  );
}
