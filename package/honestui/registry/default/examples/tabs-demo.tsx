import { Tabs, TabsList, TabsPanel, TabsTab } from "@/registry/default/ui/tabs"

export default function TabsDemo() {
  return (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTab value="profile">Profile</TabsTab>
        <TabsTab value="notifications">Notifications</TabsTab>
        <TabsTab value="billing">Billing</TabsTab>
      </TabsList>
      <TabsPanel value="profile">
        <p className="p-4 text-center text-xs text-muted-foreground">
          Your name, photo, and public details.
        </p>
      </TabsPanel>
      <TabsPanel value="notifications">
        <p className="p-4 text-center text-xs text-muted-foreground">
          Which updates reach you, and where.
        </p>
      </TabsPanel>
      <TabsPanel value="billing">
        <p className="p-4 text-center text-xs text-muted-foreground">
          Your plan, payment method, and invoices.
        </p>
      </TabsPanel>
    </Tabs>
  )
}
