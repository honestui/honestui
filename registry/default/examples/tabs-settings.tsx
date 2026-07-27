import { Tabs, TabsList, TabsPanel, TabsTab } from "@/registry/default/ui/tabs"

export default function TabsSettings() {
  return (
    <Tabs defaultValue="profile" className="w-full max-w-sm">
      <TabsList><TabsTab value="profile">Profile</TabsTab><TabsTab value="security">Security</TabsTab></TabsList>
      <TabsPanel value="profile" className="rounded-xl border p-4 text-sm text-muted-foreground">Update your public workspace profile.</TabsPanel>
      <TabsPanel value="security" className="rounded-xl border p-4 text-sm text-muted-foreground">Manage sessions and two-factor settings.</TabsPanel>
    </Tabs>
  )
}
