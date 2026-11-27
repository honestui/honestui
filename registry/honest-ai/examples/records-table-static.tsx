import { RecordsTable } from "@/registry/honest-ai/ai/records-table"

export default function RecordsTableStaticExample() {
  return (
    <div className="w-full max-w-xl min-w-0">
      <RecordsTable
        label="Tickets"
        columns={[
          { id: "title", header: "Ticket" },
          { id: "category", header: "Category", isGenerated: true },
        ]}
        rows={[
          {
            id: "1",
            name: "Export totals are off",
            cells: { title: "Export totals are off" },
            generated: { category: { status: "done", value: "Billing" } },
          },
          {
            id: "2",
            name: "Cannot reset password",
            cells: { title: "Cannot reset password" },
            generated: { category: { status: "done", value: "Account" } },
          },
        ]}
      />
    </div>
  )
}
