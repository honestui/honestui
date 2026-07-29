import { KanbanList } from "@/registry/default/ui/kanban-list"

export default function KanbanListKanbanDemo() {
  return <KanbanList className="kanban-list--preview-two-columns" columns={["to-call", "called"]} />
}
