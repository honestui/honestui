import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@/registry/default/ui/autocomplete"

const members = [
  { label: "Avery Stone", value: "avery" },
  { label: "Jordan Lee", value: "jordan" },
  { label: "Morgan Chen", value: "morgan" },
]

export default function AutocompleteMembers() {
  return (
    <div className="w-full max-w-xs">
      <Autocomplete items={members}>
        <AutocompleteInput
          showClear
          showTrigger
          placeholder="Find a teammate"
        />
        <AutocompletePopup>
          <AutocompleteEmpty>No members found.</AutocompleteEmpty>
          <AutocompleteList>
            {(member) => (
              <AutocompleteItem key={member.value} value={member}>
                {member.label}
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompletePopup>
      </Autocomplete>
    </div>
  )
}
