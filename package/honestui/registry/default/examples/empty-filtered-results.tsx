import { SearchX as SearchXIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/registry/default/ui/empty"

export default function EmptyFilteredResults() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon"><SearchXIcon /></EmptyMedia>
        <EmptyTitle>No matching filters</EmptyTitle>
        <EmptyDescription>Try clearing a status or date filter.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><Button variant="secondary" size="sm">Reset filters</Button></EmptyContent>
    </Empty>
  )
}
