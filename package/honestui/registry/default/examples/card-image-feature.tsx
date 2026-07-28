import { ArrowRight as ArrowRightIcon, Bell as BellIcon, Sparkles as SparklesIcon } from "honestui/icons"

import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Card, CardContent } from "@/registry/default/ui/card"

export default function CardImageFeature() {
  return (
    <Card className="w-full max-w-xs">
      <CardContent className="flex flex-col gap-4">
        <div className="relative h-48 w-full overflow-hidden rounded-lg">
          <img
            src="https://picsum.photos/1000/800?grayscale&random=18"
            alt="Abstract grayscale workspace"
            className="absolute inset-0 size-full object-cover"
          />
        </div>

        <div className="flex items-center justify-between gap-5">
          <Badge variant="outline">
            <BellIcon aria-hidden="true" />
            Trending
          </Badge>
          <div className="flex items-center gap-1">
            <SparklesIcon aria-hidden="true" />
            <span className="text-xs font-medium text-secondary-foreground">
              Featured
            </span>
          </div>
        </div>

        <p className="text-sm text-foreground">
          Simplifying your workflow from day one. Manage your tasks, projects,
          and team in one place.
        </p>

        <Button>
          Get Started
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  )
}
