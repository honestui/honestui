import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  Ellipsis as MoreHorizontalIcon,
  Pin as PinIcon,
  Settings as SettingsIcon,
  Share2 as Share2Icon,
  Trash as TrashIcon,
  TriangleAlert as TriangleAlertIcon,
} from "honestui/icons"

import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Card, CardContent } from "@/registry/default/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/default/ui/menu"
import { Separator } from "@/registry/default/ui/separator"

export default function CardMetricActions() {
  const title = "Revenue"
  const value = "$12.4k"
  const delta = 12.5
  const positive = true
  const lastMonth = "$11.0k"

  return (
    <Card className="w-full max-w-xs">
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="-me-1.5"
                  aria-label="More options"
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <SettingsIcon aria-hidden="true" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <TriangleAlertIcon aria-hidden="true" />
                  Add Alert
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PinIcon aria-hidden="true" />
                  Pin to Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2Icon aria-hidden="true" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <TrashIcon aria-hidden="true" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-medium tracking-tight tabular-nums text-foreground">
              {value}
            </span>
            <Badge variant={positive ? "success" : "error"}>
              {positive ? (
                <ArrowUpIcon aria-hidden="true" />
              ) : (
                <ArrowDownIcon aria-hidden="true" />
              )}
              {delta}%
            </Badge>
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            Vs last month:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {lastMonth}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
