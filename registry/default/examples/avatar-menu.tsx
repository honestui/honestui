import {
  ChevronsUpDown as ChevronsUpDownIcon,
  LogOut as LogOutIcon,
  Plus as PlusIcon,
  Settings as SettingsIcon,
  User as UserIcon,
} from "honestui/icons"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"
import { Button } from "@/registry/default/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/default/ui/menu"

export default function AvatarMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full pr-2.5 pl-1"
          />
        }
      >
        <Avatar className="size-6 border border-background">
          <AvatarImage
            src="https://images.unsplash.com/photo-1542595913-85d69b0edbaf?w=96&h=96&dpr=2&q=80"
            alt="Liam Thompson"
          />
          <AvatarFallback>LT</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">Liam Thompson</span>
        <ChevronsUpDownIcon
          className="size-3.5 opacity-60"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44" align="center" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Management</DropdownMenuLabel>
          <DropdownMenuItem>
            <UserIcon aria-hidden="true" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon aria-hidden="true" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon aria-hidden="true" />
            <span>Teams</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <PlusIcon aria-hidden="true" />
            <span>Invite</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOutIcon aria-hidden="true" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
