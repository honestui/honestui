import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/default/ui/accordion";
import { Button } from "@/registry/default/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card";
import { ArrowUpRight as ArrowUpRightIcon } from "honestui/icons";

const items = [
  {
    value: "installation",
    trigger: "How do I add a component?",
    content: (
      <>
        <p>
          Start with the installation guide, then add only the components your
          project uses. The copied source stays in your repository.
        </p>
        <Button
          render={<Link href="/docs/get-started" />}
          size="sm"
          className="mt-4"
        >
          Read installation guide
          <ArrowUpRightIcon className="size-4" />
        </Button>
      </>
    ),
  },
  {
    value: "ownership",
    trigger: "Where does the code live?",
    content: (
      <>
        <p>
          Component source is copied into your project. You can inspect, edit,
          test, and remove it without relying on a hosted runtime.
        </p>
      </>
    ),
  },
  {
    value: "security",
    trigger: "Does Honest UI secure my application?",
    content: (
      <>
        <p>
          Honest UI components are source code, so your application keeps
          responsibility for authentication, authorization, storage, and data
          handling.
        </p>
        <p>
          Review dependencies and application behavior against your own threat
          model before shipping.
        </p>
      </>
    ),
  },
];

export default function AccordionInCard() {
  return (
    <div className="mx-auto mb-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Honest UI basics</CardTitle>
          <CardDescription>
            Common questions about installing and owning the component source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion multiple defaultValue={["installation"]}>
            {items.map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger>{item.trigger}</AccordionTrigger>
                <AccordionContent>{item.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
import Link from "next/link";
