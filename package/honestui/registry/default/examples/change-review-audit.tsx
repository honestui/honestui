"use client"

import {
  ChangeReview,
  ChangeReviewHeader,
  ChangeReviewList,
  type ChangeReviewChange,
} from "@/registry/default/product/change-review/change-review"

// A sample audit entry as an application might store it: records, not snapshots.
const entry: { actor: string; at: string; changes: ChangeReviewChange[] } = {
  actor: "Ana Ruiz",
  at: "2026-09-14T09:32:00Z",
  changes: [
    { id: "plan", label: "Plan", before: "Team", after: "Business" },
    { id: "seats", label: "Seats", before: 12, after: 20 },
    {
      id: "sso",
      label: "Single sign-on",
      type: "boolean",
      before: false,
      after: true,
    },
    {
      id: "domains",
      label: "Allowed domains",
      kind: "list",
      added: ["northwind.example"],
      removed: [],
    },
  ],
}

const when = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

export default function ChangeReviewAudit() {
  return (
    <ChangeReview
      aria-label={`Changes made by ${entry.actor}`}
      changes={entry.changes}
      className="max-w-2xl"
    >
      <ChangeReviewHeader className="justify-start gap-x-[var(--hui-space-3)]">
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)] [line-height:1]"
        >
          AR
        </span>
        <p className="m-0 min-w-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-control,13px)] [line-height:20px]">
          <span className="text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]">
            {entry.actor}
          </span>{" "}
          changed the subscription on{" "}
          <time dateTime={entry.at}>{when.format(new Date(entry.at))} UTC</time>
        </p>
      </ChangeReviewHeader>
      <ChangeReviewList />
    </ChangeReview>
  )
}
