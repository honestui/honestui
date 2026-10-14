import { Tabs, TabsList, TabsPanel, TabsTab } from "@/registry/default/ui/tabs"

export default function TabsUnderline() {
  return (
    <Tabs defaultValue="tab-1">
      <div className="border-b">
        <TabsList variant="underline">
          <TabsTab value="tab-1">Overview</TabsTab>
          <TabsTab value="tab-2">Activity</TabsTab>
          <TabsTab value="tab-3">Settings</TabsTab>
        </TabsList>
      </div>
      <TabsPanel value="tab-1">
        <p className="p-4 text-center text-xs text-muted-foreground">
          Summary of the project.
        </p>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <p className="p-4 text-center text-xs text-muted-foreground">
          Recent changes and comments.
        </p>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <p className="p-4 text-center text-xs text-muted-foreground">
          Name, access, and integrations.
        </p>
      </TabsPanel>
    </Tabs>
  )
}
