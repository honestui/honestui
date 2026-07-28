import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"

export default function CardWithBorders() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader className="border-b">
        <CardTitle>Header with Border</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          The header and footer use borders to create visual separation between
          card sections.
        </p>
      </CardContent>
      <CardFooter className="border-t">
        <Button variant="outline" className="w-full">
          Action
        </Button>
      </CardFooter>
    </Card>
  )
}
