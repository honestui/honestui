import Link from "next/link";
import { House as HomeIcon } from "honestui/icons";

import {
  Breadcrumb,
  BreadcrumbDropdownItem,
  BreadcrumbDropdownTrigger,
  BreadcrumbEllipsis,
  BreadcrumbIcon,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/registry/default/ui/breadcrumb";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/registry/default/ui/menu";

export default function BreadcrumbDemo() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>
            <BreadcrumbIcon>
              <HomeIcon aria-hidden="true" />
            </BreadcrumbIcon>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <Menu>
            <MenuTrigger
              render={
                <BreadcrumbDropdownTrigger aria-label="Show hidden breadcrumb levels" />
              }
            >
              <BreadcrumbEllipsis />
            </MenuTrigger>
            <MenuPopup align="start">
              <MenuItem
                render={
                  <BreadcrumbDropdownItem render={<Link href="/docs" />} />
                }
              >
                Docs
              </MenuItem>
              <MenuItem
                render={
                  <BreadcrumbDropdownItem
                    render={<Link href="/docs/get-started" />}
                  />
                }
              >
                Get started
              </MenuItem>
            </MenuPopup>
          </Menu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/docs/components/button" />}>
            Components
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
