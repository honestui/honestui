import { Skeleton } from "@/components/ui/skeleton";

/** Route-level loading state mirroring the dashboard's layout. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32 max-w-full" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3.5 w-36 max-w-full" />
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-8 w-72 max-w-full" />
        </div>
        <Skeleton className="h-72 w-full sm:h-80" />
      </div>

      {/* Two-column analytics */}
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
            <Skeleton className="h-56 w-full" />
          </div>
        ))}
      </div>

      {/* Customers table */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <div className="border-b p-4">
            <Skeleton className="h-8 w-64 max-w-full" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
