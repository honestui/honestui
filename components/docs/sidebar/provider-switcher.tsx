"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ChartStackedLineIcon,
  CheckIcon,
  ComponentBlocksIcon,
  IconLibraryIcon,
  MotionIcon,
  ShaderIcon,
} from "@/assets/icons";
import { usePathname, useRouter } from "next/navigation";
import { CaretDown } from "@carbon/icons-react";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";

export type ProductArea = "components" | "charts" | "icons" | "animated" | "shaders";

interface ProductAreaMeta {
  id: ProductArea;
  name: string;
  tagline: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
}

const PRODUCT_AREAS: ProductAreaMeta[] = [
  {
    id: "components",
    name: "UI Components",
    tagline: "Accessible building blocks",
    href: "/docs",
    icon: ComponentBlocksIcon,
    tint:
      "text-[#E43861] group-focus/dropdown-menu-item:text-[#E43861]!",
  },
  {
    id: "charts",
    name: "Charts",
    tagline: "Composable data visualization",
    href: "/docs/charts",
    icon: ChartStackedLineIcon,
    tint:
      "text-[#60DAFB] group-focus/dropdown-menu-item:text-[#60DAFB]!",
  },
  {
    id: "icons",
    name: "Icons & Assets",
    tagline: "Icons, logos, and vectors",
    href: "/docs/icons",
    icon: IconLibraryIcon,
    tint:
      "text-amber-400 group-focus/dropdown-menu-item:text-amber-400!",
  },
  {
    id: "animated",
    name: "Animated Components",
    tagline: "Purposeful interaction patterns",
    href: "/docs/animated",
    icon: MotionIcon,
    tint:
      "text-emerald-400 group-focus/dropdown-menu-item:text-emerald-400!",
  },
  {
    id: "shaders",
    name: "Shaders",
    tagline: "GPU-rendered visual effects",
    href: "/docs/shaders",
    icon: ShaderIcon,
    tint:
      "text-fuchsia-400 group-focus/dropdown-menu-item:text-fuchsia-400!",
  },
];

export function areaFromPathname(pathname: string): ProductArea {
  if (
    pathname === "/docs/charts" ||
    pathname.startsWith("/docs/chart-") ||
    pathname.startsWith("/docs/charts/")
  ) {
    return "charts";
  }

  if (pathname === "/docs/icons" || pathname.startsWith("/docs/icons/")) {
    return "icons";
  }

  if (pathname === "/docs/animated" || pathname.startsWith("/docs/animated/")) {
    return "animated";
  }

  if (pathname === "/docs/shaders" || pathname.startsWith("/docs/shaders/")) {
    return "shaders";
  }

  return "components";
}

function ProductAreaIcon({
  area,
  className,
}: {
  area: ProductAreaMeta;
  className?: string;
}) {
  const Icon = area.icon;

  return <Icon className={cn(area.tint, className)} aria-hidden="true" />;
}

export function ProviderSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const activeArea = areaFromPathname(pathname);
  const displayed = PRODUCT_AREAS.find((area) => area.id === activeArea)!;

  const selectArea = (area: ProductAreaMeta) => {
    if (isMobile) {
      setOpenMobile(false);
    }

    if (area.id !== activeArea) {
      posthog.capture("documentation_product_area_selected", {
        product_area: area.id,
      });
      router.push(area.href);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className={cn(
                  "data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground",
                  "border-border/60 border",
                )}
              />
            }
          >
            <ProductAreaIcon area={displayed} className="size-7!" />
            <div className="ml-0.5 grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">{displayed.name}</span>
              <span className="text-muted-foreground truncate text-[11px]">
                {displayed.tagline}
              </span>
            </div>
            <CaretDown className="ml-auto opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={4}
            className="bg-background w-(--anchor-width)"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Library
              </DropdownMenuLabel>
              {PRODUCT_AREAS.map((area) => {
                const isActive = activeArea === area.id;

                return (
                  <DropdownMenuItem
                    key={area.id}
                    onClick={() => selectArea(area)}
                    className="gap-2 p-2 focus:bg-[var(--rs-color-background-base-primary-hover)]! focus:text-[var(--rs-color-foreground-base-primary)]!"
                  >
                    <ProductAreaIcon area={area} className="size-6!" />
                    <div className="ml-0.5 grid min-w-0 flex-1 leading-tight">
                      <span className="truncate text-sm group-focus/dropdown-menu-item:text-[var(--rs-color-foreground-base-primary)]!">
                        {area.name}
                      </span>
                      <span className="text-muted-foreground truncate text-[11px] group-focus/dropdown-menu-item:text-[var(--rs-color-foreground-base-secondary)]!">
                        {area.tagline}
                      </span>
                    </div>
                    {isActive && (
                      <CheckIcon className="size-3.5 group-focus/dropdown-menu-item:text-[var(--rs-color-foreground-base-primary)]!" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
