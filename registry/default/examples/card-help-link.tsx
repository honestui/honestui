import { ExternalLink as ExternalLinkIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"

export default function CardHelpLink() {
  return (
    <Card className="w-full max-w-xs gap-2 pt-5">
      <CardHeader>
        <CardTitle>Need help with a claim?</CardTitle>
      </CardHeader>
      <CardContent className="mb-2">
        <p>
          Go to this step by step guideline process on how to certify for your
          weekly benefits.
        </p>
      </CardContent>
      <CardFooter className="py-2">
        <Button variant="link" className="px-0">
          See our guideline
          <ExternalLinkIcon aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  )
}
