"use client";

import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/registry/default/animated/theme-toggle";

const ThemeSwitcher = () => {
  return (
    <>
      <ThemeToggle
        className={buttonVariants({ variant: "ghost", size: "icon" })}
        iconClassName="size-3.5"
        variant="blinds"
      />
      <span className="text-muted">|</span>
    </>
  );
};

export default ThemeSwitcher;
