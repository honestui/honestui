import type { ReactNode } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";

/**
 * Applies the stored (or system) theme before the dashboard paints so there
 * is no flash of the wrong theme. The theme lives in `data-theme` for
 * HonestUI tokens and the `dark` class for Tailwind variants and chart
 * theming. If your root layout already does this, remove the script here —
 * and either way, add `suppressHydrationWarning` to `<html>` in your root
 * layout since the theme is applied on the client.
 */
const themeInitScript = `(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (theme !== "light" && theme !== "dark") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch (_) {}
})();`;

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
