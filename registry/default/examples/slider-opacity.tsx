import { Slider, SliderValue } from "@/registry/default/ui/slider"

export default function SliderOpacity() {
  return (
    <Slider className="max-w-xs" defaultValue={72}>
      <div className="mb-2 flex justify-between text-sm font-medium">
        <span>Opacity</span>
        <SliderValue />
      </div>
    </Slider>
  )
}
