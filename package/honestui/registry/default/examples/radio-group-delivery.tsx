import { Radio, RadioGroup } from "@/registry/default/ui/radio-group"

const options = ["Standard", "Express", "Overnight"]

export default function RadioGroupDelivery() {
  return (
    <RadioGroup defaultValue="Express" className="rounded-xl border p-4">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 text-sm font-medium">
          <Radio value={option} />
          {option}
        </label>
      ))}
    </RadioGroup>
  )
}
