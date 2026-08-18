"use client"

import * as React from "react"
import {
  Command as CommandIcon,
  File as FileIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  User as UserIcon,
} from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  Command,
  CommandContent,
  CommandDialog,
  CommandDialogContent,
  CommandDialogTrigger,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandLabel,
} from "@/registry/default/ui/command"

export default function CommandDialogDemo() {
  const [open, setOpen] = React.useState(false)
  const [lastAction, setLastAction] = React.useState("No command selected")

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLocaleLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((currentOpen) => !currentOpen)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  function runCommand(message: string) {
    setLastAction(message)
    setOpen(false)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandDialogTrigger render={<Button variant="secondary" />}>
          <CommandIcon />
          Open command palette
          <span className="text-xs opacity-72">⌘K</span>
        </CommandDialogTrigger>
        <CommandDialogContent title="Workspace commands">
          <Command>
            <CommandInput
              leadingIcon={<SearchIcon />}
              placeholder="Search workspace commands..."
            />
            <CommandContent>
              <CommandEmpty>No matching commands.</CommandEmpty>
              <CommandGroup>
                <CommandLabel>Workspace</CommandLabel>
                <CommandItem
                  leadingIcon={<FileIcon />}
                  onClick={() => runCommand("Opened a new document")}
                >
                  New document
                </CommandItem>
                <CommandItem
                  leadingIcon={<UserIcon />}
                  onClick={() => runCommand("Opened team members")}
                >
                  View team members
                </CommandItem>
                <CommandItem
                  leadingIcon={<SettingsIcon />}
                  onClick={() => runCommand("Opened workspace settings")}
                >
                  Workspace settings
                </CommandItem>
              </CommandGroup>
            </CommandContent>
          </Command>
        </CommandDialogContent>
      </CommandDialog>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {lastAction}
      </p>
    </div>
  )
}
