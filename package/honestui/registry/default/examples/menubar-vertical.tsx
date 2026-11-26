"use client"

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/registry/default/ui/menubar"

export default function MenubarVertical() {
  return (
    <Menubar orientation="vertical" className="w-44">
      <MenubarMenu>
        <MenubarTrigger>Projects</MenubarTrigger>
        <MenubarContent sideOffset={8} alignOffset={0}>
          <MenubarItem>New project</MenubarItem>
          <MenubarItem>Import from Git</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>View archived</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Team</MenubarTrigger>
        <MenubarContent sideOffset={8} alignOffset={0}>
          <MenubarItem>Invite members</MenubarItem>
          <MenubarItem>Roles and permissions</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu disabled>
        <MenubarTrigger>Billing</MenubarTrigger>
        <MenubarContent sideOffset={8} alignOffset={0}>
          <MenubarItem>Invoices</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
