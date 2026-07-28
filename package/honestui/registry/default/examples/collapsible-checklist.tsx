import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/registry/default/ui/collapsible"
import { Checkbox } from "@/registry/default/ui/checkbox"

const tasks = ["Invite teammates", "Create first project", "Connect billing"]

export default function CollapsibleChecklist() {
  return (
    <Collapsible className="w-full max-w-sm rounded-xl border p-4" defaultOpen>
      <CollapsibleTrigger className="font-medium">Setup checklist</CollapsibleTrigger>
      <CollapsiblePanel className="pt-3">
        <div className="grid gap-2">
          {tasks.map((task, index) => (
            <label key={task} className="flex items-center gap-2 text-sm">
              <Checkbox defaultChecked={index === 0} />
              {task}
            </label>
          ))}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  )
}
