import { Button } from "@/registry/default/ui/button"
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "@/registry/default/ui/popover"

const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"]

export default function PopoverColorSwatch() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Pick color</PopoverTrigger>
      <PopoverPopup className="w-56">
        <PopoverTitle className="mb-3 text-base">Label color</PopoverTitle>
        <div className="flex gap-2">
          {colors.map((color) => <button key={color} className={
            "size-8 rounded-full border " + color
          } aria-label={color} />)}
        </div>
      </PopoverPopup>
    </Popover>
  )
}
