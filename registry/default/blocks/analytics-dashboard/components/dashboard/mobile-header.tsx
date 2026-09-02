"use client";

import { useState } from "react";
import { Menu } from "honestui/icons";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AccountMenu } from "./account-menu";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";

/** Compact top bar with sheet navigation — shown below lg. */
export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-background px-4 py-2.5 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Open navigation" />
          }
        >
          <Menu aria-hidden className="size-4" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle>
              <Brand />
            </SheetTitle>
            <SheetDescription className="sr-only">
              Main navigation
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col overflow-y-auto px-2.5 pb-4">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
          <div className="px-2.5 pb-3">
            <Separator variant="secondary" className="mb-3" />
            <AccountMenu />
          </div>
        </SheetContent>
      </Sheet>
      <Brand />
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  );
}
