"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Check, ChevronsUpDown } from "honestui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AnimatedAreaIcon,
  ChartsAreaIcon,
  ComponentsAreaIcon,
  ExamplesAreaIcon,
  IconsAreaIcon,
  ProductAreaIcon,
  ShadersAreaIcon,
  type ProductAreaIconProps,
} from "./product-area-icons";

export type ProductArea =
  | "components"
  | "product"
  | "charts"
  | "icons"
  | "animated"
  | "shaders"
  | "examples";

interface ProductAreaMeta {
  id: ProductArea;
  name: string;
  /** Names what is inside the area, not what it aspires to be. */
  tagline: string;
  href: string;
  /** Path prefixes owned by this area besides `href` and its children. */
  owns?: string[];
  icon: React.ComponentType<ProductAreaIconProps>;
}

interface ProductAreaGroup {
  /**
   * Accessible name only. The rows name themselves, so a visible heading
   * would repeat them; a rule between groups is the only visual grouping.
   */
  label: string;
  areas: ProductAreaMeta[];
}

/**
 * The single source for the switcher: order, grouping, copy, and which paths
 * belong to which area. `/docs` is the fallback area, so it must stay first.
 */
const PRODUCT_AREA_GROUPS: ProductAreaGroup[] = [
  {
    label: "Components",
    areas: [
      {
        id: "components",
        name: "UI Components",
        tagline: "Buttons, inputs, dialogs",
        href: "/docs",
        icon: ComponentsAreaIcon,
      },
      {
        id: "product",
        name: "Product Components",
        tagline: "Grids, filters, uploads",
        href: "/docs/product",
        icon: ProductAreaIcon,
      },
      {
        id: "animated",
        name: "Animated Components",
        tagline: "Dock, marquee, text reveal",
        href: "/docs/animated",
        icon: AnimatedAreaIcon,
      },
    ],
  },
  {
    label: "Visuals",
    areas: [
      {
        id: "charts",
        name: "Charts",
        tagline: "Line, bar, heatmap",
        href: "/docs/charts",
        owns: ["/docs/chart-"],
        icon: ChartsAreaIcon,
      },
      {
        id: "icons",
        name: "Icons & Assets",
        tagline: "Icon set, logos, vectors",
        href: "/docs/icons",
        icon: IconsAreaIcon,
      },
      {
        id: "shaders",
        name: "Shaders",
        tagline: "Grain, dither, light rays",
        href: "/docs/shaders",
        icon: ShadersAreaIcon,
      },
    ],
  },
  {
    label: "Showcase",
    areas: [
      {
        id: "examples",
        name: "Examples",
        tagline: "AI workspace, CRM list",
        href: "/docs/examples",
        icon: ExamplesAreaIcon,
      },
    ],
  },
];

const PRODUCT_AREAS = PRODUCT_AREA_GROUPS.flatMap((group) => group.areas);
const FALLBACK_AREA = PRODUCT_AREAS[0];

function ownsPathname(area: ProductAreaMeta, pathname: string) {
  return (
    pathname === area.href ||
    pathname.startsWith(`${area.href}/`) ||
    (area.owns?.some((prefix) => pathname.startsWith(prefix)) ?? false)
  );
}

export function areaFromPathname(pathname: string): ProductArea {
  const match = PRODUCT_AREAS.find(
    (area) => area !== FALLBACK_AREA && ownsPathname(area, pathname),
  );

  return (match ?? FALLBACK_AREA).id;
}

export function ProviderSwitcher() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const activeArea = areaFromPathname(pathname);
  const displayed = PRODUCT_AREAS.find((area) => area.id === activeArea)!;
  const DisplayedIcon = displayed.icon;
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu
          onOpenChange={(open) => {
            if (!open) return;
            // Start on the current area instead of the first row, so the
            // highlight and the selection are one row when the menu opens.
            // Two frames: the popup must mount and take its own focus first.
            requestAnimationFrame(() =>
              requestAnimationFrame(() =>
                activeItemRef.current?.focus({ preventScroll: true }),
              ),
            );
          }}
        >
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label={`Library: ${displayed.name}`}
                // px-3 puts the tile and chevron on the same columns as the
                // menu rows' tile and check (popup inset + row padding).
                className="gap-2.5 px-3 bg-background/40 shadow-[0_0_0_0.5px_var(--hui-color-border-overlay)] hover:bg-[var(--hui-color-overlay-base-a1)] active:bg-[var(--hui-color-overlay-base-a1)] data-popup-open:bg-[var(--hui-color-overlay-base-a1)]"
              />
            }
          >
            <DisplayedIcon />
            <div className="grid min-w-0 flex-1 text-left">
              <span className="truncate text-[13px] leading-4 font-medium">{displayed.name}</span>
              <span className="truncate text-xs leading-4 text-[var(--hui-color-foreground-base-secondary)]">
                {displayed.tagline}
              </span>
            </div>
            <ChevronsUpDown
              aria-hidden="true"
              className="size-4! text-[var(--hui-color-foreground-base-tertiary)]"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={4}
            className="w-(--anchor-width) rounded-[var(--hui-radius-3)]"
          >
            {PRODUCT_AREA_GROUPS.map((group, index) => (
              <div key={group.label} className="contents">
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuGroup aria-label={group.label}>
                  {group.areas.map((area) => {
                    const isActive = activeArea === area.id;

                    return (
                      // No selected fill: the fill is the highlight's alone, so
                      // two rows never look alike. The check marks selection.
                      <MenuPrimitive.LinkItem
                        key={area.id}
                        ref={isActive ? activeItemRef : undefined}
                        closeOnClick
                        // One area is always current, so rows are radios:
                        // assistive tech announces the current one as checked.
                        role="menuitemradio"
                        aria-checked={isActive}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                        render={<Link href={area.href} />}
                        className="flex cursor-default items-center gap-2.5 rounded-[calc(var(--hui-radius-3)-var(--hui-space-2))] px-2 py-1.5 outline-hidden select-none data-highlighted:bg-[var(--hui-color-background-overlay-hover)]"
                      >
                        <area.icon />
                        <div className="grid min-w-0 flex-1">
                          <span
                            className={
                              isActive
                                ? "truncate text-[13px] leading-4 font-medium text-[var(--hui-color-foreground-base-primary)]"
                                : "truncate text-[13px] leading-4 text-[var(--hui-color-foreground-base-primary)]"
                            }
                          >
                            {area.name}
                          </span>
                          <span className="truncate text-xs leading-4 text-[var(--hui-color-foreground-base-secondary)]">
                            {area.tagline}
                          </span>
                        </div>
                        {isActive && (
                          <Check
                            aria-hidden="true"
                            className="size-4 shrink-0 text-[var(--hui-color-foreground-base-primary)]"
                          />
                        )}
                      </MenuPrimitive.LinkItem>
                    );
                  })}
                </DropdownMenuGroup>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
