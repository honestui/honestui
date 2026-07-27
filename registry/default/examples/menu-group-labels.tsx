import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/registry/default/ui/menu"

export default function MenuGroupLabelsDemo() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>
        Open menu
      </MenuTrigger>
      <MenuPopup>
        <MenuItem disabled>Account</MenuItem>
        <MenuItem>Profile</MenuItem>
        <MenuItem>Billing</MenuItem>
        <MenuSeparator />
        <MenuItem disabled>Support</MenuItem>
        <MenuItem>Docs</MenuItem>
        <MenuItem>Contact</MenuItem>
      </MenuPopup>
    </Menu>
  )
}
