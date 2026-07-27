import { Ellipsis as MoreHorizontalIcon } from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/registry/default/ui/menu"

export default function MenuProjectActions() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" size="icon" />} aria-label="Project actions"><MoreHorizontalIcon /></MenuTrigger>
      <MenuPopup>
        <MenuItem>Rename</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem>Archive</MenuItem>
      </MenuPopup>
    </Menu>
  )
}
