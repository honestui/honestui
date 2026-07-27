import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/registry/default/ui/combobox"

const assignees = [
  { label: "Ari Kim", value: "ari" },
  { label: "Blake Yu", value: "blake" },
  { label: "Casey Fox", value: "casey" },
]

export default function ComboboxAssignee() {
  return (
    <div className="w-full max-w-xs">
      <Combobox items={assignees} defaultValue="ari">
        <ComboboxInput showClear placeholder="Assign issue" />
        <ComboboxPopup>
          <ComboboxEmpty>No assignees found.</ComboboxEmpty>
          <ComboboxList>
            {(assignee) => (
              <ComboboxItem key={assignee.value} value={assignee}>
                {assignee.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
    </div>
  )
}
