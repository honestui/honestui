import {
  NativeSelect,
  NativeSelectOption,
} from "@/registry/default/ui/native-select"

const sizes = ["sm", "default", "lg"] as const

export default function NativeSelectSizes() {
  return (
    <div className="flex w-full max-w-64 flex-col gap-[var(--hui-space-4)]">
      {sizes.map((size) => (
        <NativeSelect
          key={size}
          size={size}
          aria-label={`Rows per page, ${size} size`}
          defaultValue="25"
        >
          <NativeSelectOption value="10">10 rows</NativeSelectOption>
          <NativeSelectOption value="25">25 rows</NativeSelectOption>
          <NativeSelectOption value="50">50 rows</NativeSelectOption>
          <NativeSelectOption value="100">100 rows</NativeSelectOption>
        </NativeSelect>
      ))}
      <NativeSelect variant="text" aria-label="Sort order" defaultValue="newest">
        <NativeSelectOption value="newest">Newest first</NativeSelectOption>
        <NativeSelectOption value="oldest">Oldest first</NativeSelectOption>
      </NativeSelect>
      <NativeSelect disabled aria-label="Plan (locked)" defaultValue="team">
        <NativeSelectOption value="team">Team plan</NativeSelectOption>
      </NativeSelect>
    </div>
  )
}
