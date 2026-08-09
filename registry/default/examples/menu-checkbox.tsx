import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuCheckboxItem,
  MenuPopup,
  MenuTrigger,
} from "@/registry/default/ui/menu"

export default function MenuCheckboxDemo() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="secondary" />}>
        Open menu
      </MenuTrigger>
      <MenuPopup>
        <MenuCheckboxItem defaultChecked>Auto save</MenuCheckboxItem>
        <MenuCheckboxItem>Notifications</MenuCheckboxItem>
      </MenuPopup>
    </Menu>
  )
}
