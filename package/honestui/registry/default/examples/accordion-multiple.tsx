import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/registry/default/ui/accordion"

export default function AccordionMultipleDemo() {
  return (
    <Accordion className="w-full max-w-lg" multiple={true}>
      <AccordionItem value="item-1">
        <AccordionTrigger>What is Base UI?</AccordionTrigger>
        <AccordionPanel>
          Honest UI gives you thoughtful components with visible, editable
          code that stays in your project.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I get started?</AccordionTrigger>
        <AccordionPanel>
          Head to the “Get started” guide in the docs. If you’ve used
          component libraries before, you’ll feel at home.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>
          Can I use it for my project?
        </AccordionTrigger>
        <AccordionPanel>
          Yes. Honest UI is free and open source.
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}
