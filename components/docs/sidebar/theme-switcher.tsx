"use client";

import { Moon, Sun } from "honestui/icons";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";

import { Button } from "@/components/ui/button";

type ThemeViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>;
  };
};

const ThemeSwitcher = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = (button: HTMLButtonElement) => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    const viewTransitionDocument = document as ThemeViewTransitionDocument;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      prefersReducedMotion ||
      !viewTransitionDocument.startViewTransition
    ) {
      setTheme(nextTheme);
      return;
    }

    const root = document.documentElement;
    const bounds = button.getBoundingClientRect();
    const originX = bounds.left + bounds.width / 2;
    const originY = bounds.top + bounds.height / 2;
    const radius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY),
    );

    root.style.setProperty("--theme-transition-x", `${originX}px`);
    root.style.setProperty("--theme-transition-y", `${originY}px`);
    root.style.setProperty("--theme-transition-radius", `${radius}px`);
    root.dataset.themeTransition = "circle-blur";

    const transition = viewTransitionDocument.startViewTransition(() => {
      flushSync(() => setTheme(nextTheme));
    });
    const cleanUp = () => {
      delete root.dataset.themeTransition;
      root.style.removeProperty("--theme-transition-x");
      root.style.removeProperty("--theme-transition-y");
      root.style.removeProperty("--theme-transition-radius");
    };

    void transition.finished.then(cleanUp, cleanUp);
  };

  return (
    <>
      <Button
        aria-label="Toggle color theme"
        onClick={(event) => toggleTheme(event.currentTarget)}
        size="icon"
        variant="ghost"
      >
        <Sun className="size-3.5 scale-100 rotate-0 motion-safe:transition-transform dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-3.5 scale-0 rotate-90 motion-safe:transition-transform dark:scale-100 dark:rotate-0" />
      </Button>
      <span className="text-muted">|</span>
    </>
  );
};

export default ThemeSwitcher;
