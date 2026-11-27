"use client";
import { z } from "zod/v4";
import { Card, CardHeader, CardTitle, CardContent } from "@/registry/default/ui/card";
import { Badge } from "@/registry/default/ui/badge";
import { defineComponent, honestLibrary, Renderer } from "@/registry/honest-ai/generative";

const DeliveryStatus = defineComponent({
  name: "DeliveryStatus",
  description: "A delivery summary supplied by the application",
  props: z.object({
    reference: z.string(),
    status: z.enum(["Preparing", "In transit", "Delivered"]),
    detail: z.string(),
  }),
  component: ({ props }) => (
    <Card>
      <CardHeader><CardTitle>{props.reference}</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        <Badge>{props.status}</Badge>
        <p className="m-0 text-sm">{props.detail}</p>
      </CardContent>
    </Card>
  ),
});
export const deliveryLibrary = honestLibrary.extend({ components: { add: [DeliveryStatus] } });
export const customProgram = 'root = Stack([DeliveryStatus("Example shipment 1042", "In transit", "Illustrative status. No tracking service is connected.")])';

export default function GenerativeCustomDemo() {
  return <div className="grid min-w-0 gap-4 p-4" data-slot="generative-custom-demo">
    <p className="m-0 text-sm text-muted-foreground">DeliveryStatus is registered by this example. Its card and badge are Honest UI components.</p>
    <Renderer library={deliveryLibrary} response={customProgram} />
  </div>;
}
