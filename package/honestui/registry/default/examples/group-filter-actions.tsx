import { Button } from "@/registry/default/ui/button"
import { Group, GroupItem, GroupSeparator } from "@/registry/default/ui/group"

export default function GroupFilterActions() {
  return (
    <Group>
      <GroupItem render={<Button variant="outline" />}>Open</GroupItem>
      <GroupSeparator />
      <GroupItem render={<Button variant="outline" />}>Closed</GroupItem>
      <GroupSeparator />
      <GroupItem render={<Button variant="outline" />}>Archived</GroupItem>
    </Group>
  )
}
