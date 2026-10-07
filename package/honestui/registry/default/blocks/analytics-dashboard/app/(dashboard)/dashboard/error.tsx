"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

/** Route-level error boundary for the dashboard. */
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Empty className="mt-24">
        <EmptyHeader>
          <EmptyTitle>The dashboard couldn&apos;t be loaded</EmptyTitle>
          <EmptyDescription>
            Something went wrong while rendering this page.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </Empty>
    </div>
  );
}
