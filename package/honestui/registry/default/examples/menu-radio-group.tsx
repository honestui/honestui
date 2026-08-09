import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/registry/default/ui/menu"

export default function MenuRadioGroupDemo() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="secondary" />}>
        Open menu
      </MenuTrigger>
      <MenuPopup>
        <MenuRadioGroup defaultValue="system">
          <MenuRadioItem value="light">Light</MenuRadioItem>
          <MenuRadioItem value="dark">Dark</MenuRadioItem>
          <MenuRadioItem value="system">System</MenuRadioItem>
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  )
}
