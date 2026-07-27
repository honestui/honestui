import { Book as BookIcon, Route as RouteIcon } from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/registry/default/ui/empty"

export default function EmptyDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RouteIcon />
        </EmptyMedia>
        <EmptyTitle>No upcoming meetings</EmptyTitle>
        <EmptyDescription>
          Create a meeting to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button size="sm">Create meeting</Button>
          <Button variant="outline" size="sm">
            <BookIcon className="opacity-72" />
            View docs
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  )
}
