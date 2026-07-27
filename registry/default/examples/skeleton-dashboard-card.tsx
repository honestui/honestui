import { Skeleton } from "@/registry/default/ui/skeleton"

export default function SkeletonDashboardCard() {
  return (
    <div className="w-full max-w-sm rounded-xl border p-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-10 w-40" />
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>
  )
}
