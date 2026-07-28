import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/registry/default/ui/card"

export default function CardBillingPlan() {
  return (
    <Card className="w-full max-w-xs" variant="outline">
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>For growing product teams.</CardDescription>
      </CardHeader>
      <CardPanel>
        <div className="text-3xl font-semibold">$29<span className="text-sm font-normal text-muted-foreground">/seat</span></div>
      </CardPanel>
      <CardFooter>
        <Button className="w-full">Upgrade</Button>
      </CardFooter>
    </Card>
  )
}
