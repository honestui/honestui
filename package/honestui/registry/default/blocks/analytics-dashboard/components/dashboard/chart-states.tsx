import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/** Shown in place of a chart when the selected period has no data. */
export function ChartEmptyState({ className }: { className?: string }) {
  return (
    <Empty className={cn("h-full justify-center", className)}>
      <EmptyHeader>
        <EmptyTitle>No data for this period</EmptyTitle>
        <EmptyDescription>
          Try a different date range to see activity.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/**
 * Shown in place of a chart when its data fails to load. The starter's mock
 * data never fails; wire `onRetry` to your refetch when real data arrives.
 */
export function ChartErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Empty className={cn("h-full justify-center", className)}>
      <EmptyHeader>
        <EmptyTitle>{message}</EmptyTitle>
        <EmptyDescription>
          Check your connection, then load the chart again.
        </EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Empty>
  );
}
