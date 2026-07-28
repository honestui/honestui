import { ArrowRight as ArrowRightIcon, Bell as BellIcon } from "honestui/icons"

import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Card, CardContent } from "@/registry/default/ui/card"

export default function CardImageCentered() {
  return (
    <Card className="w-full max-w-xs p-0">
      <CardContent className="flex flex-col gap-5 p-0">
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src="https://picsum.photos/1000/800?grayscale&random=52"
            alt="Abstract grayscale interface"
            className="absolute inset-0 size-full object-cover"
          />
        </div>

        <div className="flex flex-col items-center gap-4 p-6 pt-0">
          <Badge variant="outline">
            <BellIcon aria-hidden="true" />
            Trending
          </Badge>

          <p className="text-center text-sm text-foreground">
            Making your design process faster and easier. Design tools for your
            team.
          </p>

          <Button className="w-fit">
            Get Started
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
