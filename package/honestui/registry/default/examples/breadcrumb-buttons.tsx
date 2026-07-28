import {
  ChevronRight as ChevronRightIcon,
  House as HouseIcon,
  LayoutGrid as LayoutGridIcon,
  Settings as SettingsIcon,
} from "honestui/icons"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/registry/default/ui/breadcrumb"
import { Button } from "@/registry/default/ui/button"

export default function BreadcrumbButtons() {
  return (
    <Breadcrumb>
      <BreadcrumbList className="sm:gap-1">
        <BreadcrumbItem>
          <BreadcrumbLink
            render={<Button variant="ghost" size="sm" />}
            href="#"
          >
            <HouseIcon />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator>
          <ChevronRightIcon />
        </BreadcrumbSeparator>

        <BreadcrumbItem>
          <BreadcrumbLink
            href="#"
            render={<Button variant="ghost" size="sm" />}
          >
            <LayoutGridIcon />
            Workspace
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator>
          <ChevronRightIcon />
        </BreadcrumbSeparator>

        <BreadcrumbItem>
          <BreadcrumbPage>
            <Button variant="secondary" size="sm">
              <SettingsIcon />
              Settings
            </Button>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
