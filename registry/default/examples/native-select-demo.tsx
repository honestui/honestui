import {
  NativeSelect,
  NativeSelectOption,
} from "@/registry/default/ui/native-select"

export default function NativeSelectDemo() {
  return (
    <NativeSelect
      aria-label="Status"
      defaultValue="in-progress"
      wrapperClassName="max-w-64"
    >
      <NativeSelectOption value="backlog">Backlog</NativeSelectOption>
      <NativeSelectOption value="todo">To do</NativeSelectOption>
      <NativeSelectOption value="in-progress">In progress</NativeSelectOption>
      <NativeSelectOption value="in-review">In review</NativeSelectOption>
      <NativeSelectOption value="done">Done</NativeSelectOption>
    </NativeSelect>
  )
}
