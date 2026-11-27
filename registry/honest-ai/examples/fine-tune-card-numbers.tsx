import { FineTuneCard } from "@/registry/honest-ai/ai/fine-tune-card"

export default function FineTuneCardNumbersExample() {
  return (
    <div className="w-full max-w-xs min-w-0">
      <FineTuneCard
        title="Chart"
        defaultValues={{ width: 480, height: 240 }}
        controls={[
          { type: "number", id: "width", label: "Width", min: 120, max: 960, step: 8 },
          { type: "number", id: "height", label: "Height", min: 80, max: 640, step: 8 },
        ]}
      />
    </div>
  )
}
