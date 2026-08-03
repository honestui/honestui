"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type {
  AssetCollection,
  IconCategorySummary,
} from "@/globals/constants/icon-categories";
import {
  ActivityFilled,
  AlarmClock,
  AlignCenterHorizontal,
  Apple,
  AppWindow,
  ArrowRight,
  AwardFilled,
  Badge,
  Bell,
  BookOpen,
  Building,
  Calendar,
  Car,
  ChartBar,
  Circle,
  Clipboard,
  Clock,
  Cloud,
  CloudSunnyFilled,
  Code,
  Columns3,
  DashboardDoodle,
  DocumentTextFilled,
  Ellipsis,
  FigmaFilled,
  File,
  Folder,
  HomeRounded,
  HandDoodle,
  Leaf,
  LikeFilled,
  List,
  Locate,
  Lock,
  Mail,
  MessageCircleHeart,
  Monitor,
  MousePointer,
  Network,
  Palette,
  PanelLeft,
  PawPrint,
  Phone,
  Pi,
  Play,
  RocketDoodle,
  Scan,
  Shield,
  ShoppingCartFilled,
  Smartphone,
  Smile,
  Square,
  Stethoscope,
  Table,
  Triangle,
  Type,
  UserRound,
  WalletFilled,
  WomanFilled,
  ZodiacAries,
} from "honestui/icons";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import Link from "next/link";

type CategoryIconProps = Pick<SVGProps<SVGSVGElement>, "aria-hidden" | "className">;
type CategoryIcon = ComponentType<CategoryIconProps>;

const categoryIcons: Record<string, CategoryIcon> = {
  align: AlignCenterHorizontal,
  animal: PawPrint,
  app: AppWindow,
  arrows: ArrowRight,
  badge: Badge,
  book: BookOpen,
  brand: FigmaFilled,
  building: Building,
  business: ActivityFilled,
  calendar: Calendar,
  chart: ChartBar,
  circle: Circle,
  clipboard: Clipboard,
  clock: Clock,
  cloud: Cloud,
  code: Code,
  commerce: ShoppingCartFilled,
  communiccation: Phone,
  cursor: MousePointer,
  design: Palette,
  device: Smartphone,
  document: DocumentTextFilled,
  education: AwardFilled,
  emoji: Smile,
  file: File,
  finance: WalletFilled,
  folder: Folder,
  food: Apple,
  gender: WomanFilled,
  hand: HandDoodle,
  health: Stethoscope,
  home: HomeRounded,
  interface: DashboardDoodle,
  layout: Columns3,
  list: List,
  mail: Mail,
  math: Pi,
  message: MessageCircleHeart,
  misc: RocketDoodle,
  monitor: Monitor,
  multimedia: Play,
  nature: Leaf,
  navigation: Locate,
  network: Network,
  notification: Bell,
  others: Ellipsis,
  panel: PanelLeft,
  scan: Scan,
  security: Lock,
  shapes: Triangle,
  shield: Shield,
  square: Square,
  support: LikeFilled,
  table: Table,
  text: Type,
  time: AlarmClock,
  transport: Car,
  user: UserRound,
  weather: CloudSunnyFilled,
  zodiac: ZodiacAries,
  adobe: Palette,
  ai: RocketDoodle,
  browser: AppWindow,
  cards: Badge,
  cms: DocumentTextFilled,
  crypto: Circle,
  database: Network,
  devtool: Code,
  flags: AwardFilled,
  framework: Columns3,
  google: Cloud,
  language: Code,
  library: BookOpen,
  music: Play,
  payment: WalletFilled,
  social: MessageCircleHeart,
  software: AppWindow,
  sports: AwardFilled,
  stickers: Badge,
  abstract: DashboardDoodle,
  busts: UserRound,
  ellipse: Circle,
  flower: Leaf,
  geometric: Triangle,
  moon: CloudSunnyFilled,
  number: Type,
  organic: Leaf,
  polygon: Triangle,
  rectangle: Square,
  scribble: HandDoodle,
  sitting: UserRound,
  standing: UserRound,
  stars: AwardFilled,
  triangle: Triangle,
  wheel: Circle,
};

const collections: Array<{
  id: AssetCollection;
  name: string;
  href: string;
  icon: CategoryIcon;
}> = [
  { id: "icons", name: "Icons", href: "/docs/icons", icon: Square },
  { id: "logos", name: "Logos", href: "/docs/icons/logos", icon: FigmaFilled },
  { id: "vectors", name: "Vectors", href: "/docs/icons/vectors", icon: Palette },
];

export function assetCollectionFromPathname(pathname: string): AssetCollection | null {
  if (pathname === "/docs/icons/logos" || pathname.startsWith("/docs/icons/logos/")) {
    return "logos";
  }

  if (pathname === "/docs/icons/vectors" || pathname.startsWith("/docs/icons/vectors/")) {
    return "vectors";
  }

  if (pathname.startsWith("/docs/icons/categories/")) {
    return "icons";
  }

  return null;
}

export function IconCollectionNavigation({
  collection,
}: {
  collection: AssetCollection | null;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Collections</SidebarGroupLabel>
      <SidebarMenu>
        {collections.map((item) => {
          const CollectionIcon = item.icon;

          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                render={
                  <Link
                    href={item.href}
                    aria-current={collection === item.id ? "page" : undefined}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  />
                }
                isActive={collection === item.id}
              >
                <CollectionIcon aria-hidden="true" className="size-4 shrink-0" />
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function IconCategoryNavigation({
  categories,
  collection = "icons",
}: {
  categories: IconCategorySummary[];
  collection?: AssetCollection;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Categories</SidebarGroupLabel>
      <SidebarMenu>
        {categories.map((category) => {
          const collectionSegment = collection === "icons" ? "" : `/${collection}`;
          const url = `/docs/icons${collectionSegment}/categories/${category.slug}`;
          const isActive = pathname === url;
          const CategoryIcon = categoryIcons[category.sourceKey] ?? Ellipsis;

          return (
            <SidebarMenuItem key={category.slug}>
              <SidebarMenuButton
                render={
                  <Link
                    href={url}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  />
                }
                isActive={isActive}
              >
                <CategoryIcon aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {category.count}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
