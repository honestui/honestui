import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/registry/default/ui/menu"

const workspaces = [
  "Acme Studio",
  "Atlas Research",
  "Beacon Labs",
  "Cedar Health",
  "Field Notes",
  "Good Measure",
  "Harbor Finance",
  "Honest UI",
  "Juniper Works",
  "Northstar",
  "Open Assembly",
  "Signal House",
]

export default function MenuScrollable() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="secondary" />}>
        Switch workspace
      </MenuTrigger>
      <MenuPopup
        align="start"
        className="max-h-[min(18rem,var(--available-height))] min-w-48"
      >
        <MenuGroup>
          <MenuGroupLabel>Workspaces</MenuGroupLabel>
          {workspaces.map((workspace) => (
            <MenuItem key={workspace}>{workspace}</MenuItem>
          ))}
        </MenuGroup>
      </MenuPopup>
    </Menu>
  )
}
