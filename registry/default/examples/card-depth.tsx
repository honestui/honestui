import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"

export default function CardDepth() {
  return (
    <div className="relative size-fit">
      <Card className="relative z-1 w-full max-w-xs">
        <CardHeader>
          <CardTitle>Default Card</CardTitle>
          <CardDescription>
            This card uses the default size variant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Layered panels behind the card create a subtle stacked depth
            effect.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Action
          </Button>
        </CardFooter>
      </Card>
      <div className="absolute inset-4 -bottom-3 z-0 rounded-lg border bg-card shadow-md shadow-black/1" />
      <div className="absolute inset-2 -bottom-1.5 z-0 rounded-lg border bg-card shadow-md shadow-black/1" />
    </div>
  )
}
