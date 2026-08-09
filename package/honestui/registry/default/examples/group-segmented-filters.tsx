import { Button } from "@/registry/default/ui/button"
import { Group, GroupItem } from "@/registry/default/ui/group"

export default function GroupSegmentedFilters() {
  return (
    <Group>
      <GroupItem render={<Button variant="secondary" />}>Day</GroupItem>
      <GroupItem render={<Button variant="secondary" />}>Week</GroupItem>
      <GroupItem render={<Button variant="secondary" />}>Month</GroupItem>
    </Group>
  )
}
