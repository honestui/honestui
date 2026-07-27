import { Button } from "@/registry/default/ui/button"
import { Sheet, SheetFooter, SheetHeader, SheetPopup, SheetTitle, SheetTrigger } from "@/registry/default/ui/sheet"

export default function SheetCheckoutSummary() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Order summary</SheetTrigger>
      <SheetPopup>
        <SheetHeader><SheetTitle>Checkout</SheetTitle></SheetHeader>
        <div className="grid gap-3 px-4 text-sm">
          <div className="flex justify-between"><span>Pro plan</span><span>$29</span></div>
          <div className="flex justify-between"><span>Tax</span><span>$2.32</span></div>
          <div className="flex justify-between font-medium"><span>Total</span><span>$31.32</span></div>
        </div>
        <SheetFooter><Button>Pay now</Button></SheetFooter>
      </SheetPopup>
    </Sheet>
  )
}
