"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { primaryNav, secondaryNav, type NavItem } from "./nav";

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = !item.external && pathname === item.href;
  const Icon = item.icon;

  const className = cn(
    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground/75 transition-colors",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
    isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        <Icon aria-hidden className="size-4 shrink-0" />
        {item.label}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={className}
      onClick={onNavigate}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

/** Primary + secondary navigation, shared by the sidebar and mobile sheet. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-1 flex-col justify-between gap-8"
    >
      <ul className="flex flex-col gap-0.5">
        {primaryNav.map((item) => (
          <li key={item.href}>
            <NavLink item={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-0.5">
        {secondaryNav.map((item) => (
          <li key={item.href}>
            <NavLink item={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
