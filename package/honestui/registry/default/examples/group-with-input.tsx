import { Copy as CopyIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import { Group, GroupItem, GroupSeparator } from "@/registry/default/ui/group"
import { Input } from "@/registry/default/ui/input"

export default function GroupWithInput() {
  return (
    <Group>
      <GroupItem
        render={<Input type="text" defaultValue="https://honestui.com" />}
      />
      <GroupSeparator />
      <GroupItem
        render={
          <Button variant="outline" size="icon" aria-label="Copy" />
        }
      >
        <CopyIcon />
      </GroupItem>
    </Group>
  )
}
