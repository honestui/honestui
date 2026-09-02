"use client";

import { ChevronsUpDown } from "honestui/icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Compact account area pinned to the bottom of the sidebar. */
export function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          />
        }
      >
        <Avatar size="5" color="indigo">
          <AvatarFallback>CO</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-sidebar-foreground">
            Connor
          </span>
          <span className="truncate text-xs text-muted-foreground">
            Northstar HQ
          </span>
        </span>
        <ChevronsUpDown
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="flex flex-col">
              Connor
              <span className="text-xs font-normal text-muted-foreground">
                connor@northstar.app
              </span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<a href="https://honestui.com/docs" target="_blank" rel="noreferrer" />}
        >
          HonestUI docs
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href="https://github.com/honestui/honestui"
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          GitHub repository
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
