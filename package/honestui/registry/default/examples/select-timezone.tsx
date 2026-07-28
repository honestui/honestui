import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/registry/default/ui/select"

const timezones = [
  { label: "Pacific", value: "pt" },
  { label: "Central", value: "ct" },
  { label: "Eastern", value: "et" },
]

export default function SelectTimezone() {
  return (
    <Select items={timezones} defaultValue="pt">
      <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
      <SelectPopup>{timezones.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup>
    </Select>
  )
}
