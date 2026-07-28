import { Inbox as InboxIcon } from "honestui/icons"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/registry/default/ui/empty"

export default function EmptyInboxZero() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon"><InboxIcon /></EmptyMedia>
        <EmptyTitle>Inbox zero</EmptyTitle>
        <EmptyDescription>No unread notifications are waiting for you.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
