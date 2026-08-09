import { Ellipsis as EllipsisIcon, Files as FilesIcon, Film as FilmIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import { Group, GroupItem, GroupSeparator } from "@/registry/default/ui/group"

export default function GroupDemo() {
  return (
    <Group>
      <GroupItem render={<Button variant="secondary" />}>
        <FilesIcon />
        Files
      </GroupItem>
      <GroupSeparator />
      <GroupItem render={<Button variant="secondary" />}>
        <FilmIcon />
        Media
      </GroupItem>
      <GroupSeparator />
      <GroupItem
        render={
          <Button variant="secondary" size="icon" aria-label="Menu" />
        }
      >
        <EllipsisIcon />
      </GroupItem>
    </Group>
  )
}
