"use client"

import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"

const languages = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  csharp: "C#",
  php: "PHP",
  cpp: "C++",
  rust: "Rust",
  go: "Go",
  swift: "Swift",
}

type Language = keyof typeof languages

const values = Object.keys(languages) as Language[]

function renderValue(
  value?: { value: string } | { value: string }[]
) {
  const selectedItems = Array.isArray(value) ? value : value ? [value] : []

  if (selectedItems.length === 0) {
    return "Select languages…"
  }

  const firstValue = selectedItems[0]?.value as Language | undefined
  const firstLanguage = firstValue ? languages[firstValue] : ""
  const additionalLanguages =
    selectedItems.length > 1 ? ` (+${selectedItems.length - 1} more)` : ""
  return firstLanguage + additionalLanguages
}

export default function SelectMultiple() {
  return (
    <div className="w-full max-w-64">
      <Select multiple defaultValue={["javascript", "typescript"]}>
        <SelectTrigger className="w-full">
          <SelectValue>{renderValue}</SelectValue>
        </SelectTrigger>
        <SelectPopup alignItemWithTrigger={false}>
          {values.map((value) => (
            <SelectItem key={value} value={value}>
              {languages[value]}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  )
}
