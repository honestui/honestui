import {
  ExternalLink as ExternalLinkIcon,
  Ellipsis as MoreHorizontalIcon,
  Settings as SettingsIcon,
  User as UserIcon,
} from "honestui/icons"

import { Avatar, AvatarFallback, AvatarImage } from "@/registry/default/ui/avatar"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/default/ui/menu"

export default function CardHelpMenu() {
  return (
    <Card className="w-full max-w-xs gap-2 pt-5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Need help with a claim?</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="More options" />
            }
          >
            <MoreHorizontalIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Team Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon aria-hidden="true" />
                <span>Manage members</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon aria-hidden="true" />
                <span>Team preferences</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <ExternalLinkIcon aria-hidden="true" />
              <span>Open dashboard</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="mb-2">
        <p>
          Go to this step by step guideline process on how to certify for your
          weekly benefits.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">
          <Avatar className="size-5">
            <AvatarImage src="https://github.com/loveconnor.png" alt="@honestui" />
            <AvatarFallback>CH</AvatarFallback>
          </Avatar>
          <span className="text-xs">@honestui</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
