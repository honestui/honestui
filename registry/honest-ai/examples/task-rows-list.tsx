import { TaskRows } from "@/registry/honest-ai/ai/task-rows"

export default function TaskRowsListExample() {
  return (
    <div className="w-full max-w-md min-w-0">
      <TaskRows
        variant="list"
        tasks={[
          { id: "schema", label: "Read the schema", status: "done" },
          { id: "migration", label: "Write the migration", summary: "1 file", status: "done" },
          { id: "staging", label: "Run it on staging", status: "queued" },
        ]}
      />
    </div>
  )
}
