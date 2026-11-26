"use client"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuLinkDescription,
  NavigationMenuLinkTitle,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/registry/default/ui/navigation-menu"

const productLinks = [
  {
    href: "/docs/component-guide",
    title: "Components",
    description: "Accessible building blocks you copy into your project.",
  },
  {
    href: "/docs/charts",
    title: "Charts",
    description: "Line, bar, area, and pie charts on theme tokens.",
  },
  {
    href: "/docs/animated",
    title: "Animated",
    description: "Motion that respects reduced-motion preferences.",
  },
  {
    href: "/docs/shaders",
    title: "Shaders",
    description: "WebGL backgrounds with static fallbacks.",
  },
] as const

const resourceLinks = [
  {
    href: "/docs/get-started",
    title: "Get started",
    description: "Install the CLI and add your first component.",
  },
  {
    href: "/docs/accessibility",
    title: "Accessibility",
    description: "How every component handles focus, roles, and labels.",
  },
  {
    href: "/docs/changelog",
    title: "Changelog",
    description: "What changed in each release.",
  },
] as const

export default function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="m-0 grid list-none gap-[var(--hui-space-1)] p-0 sm:w-[30rem] sm:grid-cols-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <NavigationMenuLink href={link.href}>
                    <NavigationMenuLinkTitle>{link.title}</NavigationMenuLinkTitle>
                    <NavigationMenuLinkDescription>{link.description}</NavigationMenuLinkDescription>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="m-0 grid list-none gap-[var(--hui-space-1)] p-0 sm:w-[20rem]">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <NavigationMenuLink href={link.href}>
                    <NavigationMenuLinkTitle>{link.title}</NavigationMenuLinkTitle>
                    <NavigationMenuLinkDescription>{link.description}</NavigationMenuLinkDescription>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink variant="trigger" href="/docs/examples">
            Examples
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
