import { ScrollArea } from "@/registry/default/ui/scroll-area"

const events = ["Build passed", "Comment added", "Deploy started", "Review requested", "Issue linked", "Branch merged"]

export default function ScrollAreaActivity() {
  return (
    <ScrollArea className="h-40 w-72 rounded-xl border p-3">
      <div className="grid gap-2">
        {events.map((event) => <div key={event} className="rounded-lg bg-muted px-3 py-2 text-sm">{event}</div>)}
      </div>
    </ScrollArea>
  )
}
