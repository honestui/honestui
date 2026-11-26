"use client"

import {
  BookOpen as BookOpenIcon,
  Code as CodeIcon,
  LayoutGrid as LayoutGridIcon,
  Palette as PaletteIcon,
  Terminal as TerminalIcon,
} from "honestui/icons"

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

const guides = [
  {
    href: "/docs/get-started",
    title: "Installation",
    description: "Set up the CLI in an existing React project.",
    icon: TerminalIcon,
  },
  {
    href: "/docs/theme/overview",
    title: "Theming",
    description: "Change color, radius, and type with tokens.",
    icon: PaletteIcon,
  },
  {
    href: "/docs/developers",
    title: "Developers",
    description: "Registry, MCP server, and package exports.",
    icon: CodeIcon,
  },
] as const

export default function NavigationMenuFeatured() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-[var(--hui-space-2)] sm:w-[34rem] sm:grid-cols-[13rem_1fr]">
              {/* The featured card is still a single link with one accessible name. */}
              <NavigationMenuLink
                href="/docs/component-guide"
                className="justify-end gap-[var(--hui-space-2)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-5)] sm:min-h-48"
              >
                <LayoutGridIcon className="size-5" />
                <NavigationMenuLinkTitle className="[font-size:var(--hui-font-size-regular)]">
                  Component guide
                </NavigationMenuLinkTitle>
                <NavigationMenuLinkDescription className="line-clamp-3">
                  Choose the right component for each job, with guidance on states and accessibility.
                </NavigationMenuLinkDescription>
              </NavigationMenuLink>
              <ul className="m-0 grid list-none gap-[var(--hui-space-1)] p-0">
                {guides.map(({ icon: Icon, ...link }) => (
                  <li key={link.href}>
                    <NavigationMenuLink href={link.href}>
                      <NavigationMenuLinkTitle>
                        <Icon aria-hidden="true" />
                        {link.title}
                      </NavigationMenuLinkTitle>
                      <NavigationMenuLinkDescription className="ps-6">
                        {link.description}
                      </NavigationMenuLinkDescription>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink variant="trigger" href="/docs/accessibility">
            <BookOpenIcon aria-hidden="true" />
            Accessibility
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
