import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/registry/default/ui/native-select"

const zones = [
  {
    region: "Americas",
    options: [
      { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
      { value: "America/Denver", label: "Mountain Time (Denver)" },
      { value: "America/Chicago", label: "Central Time (Chicago)" },
      { value: "America/New_York", label: "Eastern Time (New York)" },
      { value: "America/Sao_Paulo", label: "Brasília Time (São Paulo)" },
    ],
  },
  {
    region: "Europe",
    options: [
      { value: "Europe/London", label: "Greenwich Mean Time (London)" },
      { value: "Europe/Berlin", label: "Central European Time (Berlin)" },
      { value: "Europe/Helsinki", label: "Eastern European Time (Helsinki)" },
    ],
  },
  {
    region: "Asia and Pacific",
    options: [
      { value: "Asia/Kolkata", label: "India Standard Time (Kolkata)" },
      { value: "Asia/Singapore", label: "Singapore Time" },
      { value: "Asia/Tokyo", label: "Japan Standard Time (Tokyo)" },
      { value: "Australia/Sydney", label: "Australian Eastern Time (Sydney)" },
    ],
  },
]

export default function NativeSelectGroups() {
  return (
    <NativeSelect
      aria-label="Time zone"
      defaultValue="America/New_York"
      wrapperClassName="max-w-80"
    >
      {zones.map((zone) => (
        <NativeSelectOptGroup key={zone.region} label={zone.region}>
          {zone.options.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelectOptGroup>
      ))}
    </NativeSelect>
  )
}
