"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { IconCategorySummary } from "@/globals/constants/icon-categories";
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
import type { ElementType } from "react";
import Link from "next/link";

const categoryIcons: Record<string, ElementType> = {
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
};

export function IconCategoryNavigation({
  categories,
}: {
  categories: IconCategorySummary[];
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Categories</SidebarGroupLabel>
      <SidebarMenu>
        {categories.map((category) => {
          const url = `/docs/icons/categories/${category.slug}`;
          const isActive = pathname === url;
          const CategoryIcon = categoryIcons[category.sourceKey];

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
