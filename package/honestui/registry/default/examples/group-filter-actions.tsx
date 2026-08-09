import { Button } from "@/registry/default/ui/button"
import { Group, GroupItem, GroupSeparator } from "@/registry/default/ui/group"

export default function GroupFilterActions() {
  return (
    <Group>
      <GroupItem render={<Button variant="secondary" />}>Open</GroupItem>
      <GroupSeparator />
      <GroupItem render={<Button variant="secondary" />}>Closed</GroupItem>
      <GroupSeparator />
      <GroupItem render={<Button variant="secondary" />}>Archived</GroupItem>
    </Group>
  )
}
