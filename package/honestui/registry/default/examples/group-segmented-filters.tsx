import { Button } from "@/registry/default/ui/button"
import { Group, GroupItem } from "@/registry/default/ui/group"

export default function GroupSegmentedFilters() {
  return (
    <Group>
      <GroupItem render={<Button variant="outline" />}>Day</GroupItem>
      <GroupItem render={<Button variant="outline" />}>Week</GroupItem>
      <GroupItem render={<Button variant="outline" />}>Month</GroupItem>
    </Group>
  )
}
