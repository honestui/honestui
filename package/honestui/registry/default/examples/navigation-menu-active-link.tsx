"use client"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/registry/default/ui/navigation-menu"

const links = [
  { href: "/docs/component-guide", label: "Components" },
  { href: "/docs/charts", label: "Charts" },
  { href: "/docs/shaders", label: "Shaders" },
  { href: "/docs/icons", label: "Icons" },
] as const

// In an app, compare each href against the router's current pathname.
const currentPath = "/docs/charts"

export default function NavigationMenuActiveLink() {
  return (
    <NavigationMenu viewport={false} aria-label="Library sections">
      <NavigationMenuList>
        {links.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink
              variant="trigger"
              href={link.href}
              active={link.href === currentPath}
            >
              {link.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
