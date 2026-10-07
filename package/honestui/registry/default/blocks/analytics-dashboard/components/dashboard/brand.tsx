import Link from "next/link";

import { cn } from "@/lib/utils";

/** Compact Northstar wordmark used in the sidebar and mobile header. */
export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-2 rounded-md font-medium text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-6 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
      >
        N
      </span>
      Northstar
    </Link>
  );
}
