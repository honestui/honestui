"use client"

import { Button } from "@/registry/default/ui/button"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/registry/default/ui/sheet"

export default function DialogDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Sheet>
        <SheetTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Open Right
            </Button>
          )}
        />
        <SheetPopup showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Right</SheetTitle>
            <SheetDescription>
              Right side of the screen.
            </SheetDescription>
          </SheetHeader>
        </SheetPopup>
      </Sheet>
      <Sheet>
        <SheetTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Open Left
            </Button>
          )}
        />
        <SheetPopup side="left" showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Left</SheetTitle>
            <SheetDescription>
              Left side of the screen.
            </SheetDescription>
          </SheetHeader>
        </SheetPopup>
      </Sheet>
      <Sheet>
        <SheetTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Open Top
            </Button>
          )}
        />
        <SheetPopup side="top" showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Top</SheetTitle>
            <SheetDescription>Top of the screen.</SheetDescription>
          </SheetHeader>
        </SheetPopup>
      </Sheet>
      <Sheet>
        <SheetTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Open Bottom
            </Button>
          )}
        />
        <SheetPopup side="bottom" showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Bottom</SheetTitle>
            <SheetDescription>Bottom of the screen.</SheetDescription>
          </SheetHeader>
        </SheetPopup>
      </Sheet>
    </div>
  )
}
