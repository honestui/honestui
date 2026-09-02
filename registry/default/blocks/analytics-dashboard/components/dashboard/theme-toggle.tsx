"use client";

import { Moon, Sun } from "honestui/icons";

import { Button } from "@/components/ui/button";

/**
 * Switches between light and dark by updating `data-theme` (HonestUI tokens)
 * and the `dark` class (Tailwind variants + chart themes) on <html>. The
 * icons swap via CSS so server and client markup always match.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be unavailable (private mode); the toggle still works.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      className={className}
      onClick={toggleTheme}
    >
      <Sun aria-hidden className="size-4 dark:hidden" />
      <Moon aria-hidden className="hidden size-4 dark:block" />
    </Button>
  );
}
