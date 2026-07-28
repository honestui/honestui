import { Skeleton } from "@/registry/default/ui/skeleton"

export default function SkeletonChatList() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></div>
        </div>
      ))}
    </div>
  )
}
