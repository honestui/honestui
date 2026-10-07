import type { ComponentType } from "react";
import {
  ChartLine,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Users,
  Wallet,
} from "honestui/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  external?: boolean;
}

export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: ChartLine },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/revenue", label: "Revenue", icon: Wallet },
  { href: "/reports", label: "Reports", icon: FileText },
];

export const secondaryNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  {
    href: "https://honestui.com/docs",
    label: "Help",
    icon: LifeBuoy,
    external: true,
  },
];
