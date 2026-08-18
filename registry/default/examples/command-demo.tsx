"use client"

import * as React from "react"
import {
  File as FileIcon,
  Palette as PaletteIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  User as UserIcon,
} from "honestui/icons"

import {
  Command,
  CommandContent,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandLabel,
  CommandSeparator,
} from "@/registry/default/ui/command"

export default function CommandDemo() {
  const [lastAction, setLastAction] = React.useState("No command selected")

  return (
    <div className="w-full max-w-lg space-y-3">
      <Command className="rounded-lg border border-border shadow-sm">
        <CommandInput
          leadingIcon={<SearchIcon />}
          placeholder="Search commands..."
        />
        <CommandContent>
          <CommandEmpty>No matching commands.</CommandEmpty>
          <CommandGroup>
            <CommandLabel>Navigation</CommandLabel>
            <CommandItem
              leadingIcon={<FileIcon />}
              trailingIcon={<span className="text-xs">G then D</span>}
              onClick={() => setLastAction("Opened documents")}
            >
              Open documents
            </CommandItem>
            <CommandItem
              leadingIcon={<UserIcon />}
              onClick={() => setLastAction("Opened account")}
            >
              Open account
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandLabel>Preferences</CommandLabel>
            <CommandItem
              leadingIcon={<PaletteIcon />}
              onClick={() => setLastAction("Opened appearance")}
            >
              Change appearance
            </CommandItem>
            <CommandItem
              leadingIcon={<SettingsIcon />}
              onClick={() => setLastAction("Opened settings")}
            >
              Open settings
            </CommandItem>
          </CommandGroup>
        </CommandContent>
      </Command>
      <p className="text-center text-xs text-muted-foreground" aria-live="polite">
        {lastAction}
      </p>
    </div>
  )
}
