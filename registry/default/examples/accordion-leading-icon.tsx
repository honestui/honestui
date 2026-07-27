import { ChevronRight as ChevronRightIcon } from "love-ui/icons"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/default/ui/accordion"

const items = [
  {
    value: "item-1",
    trigger: "Can I use this for my project?",
    content:
      "Yes, you can use Honest UI for any of your personal or commercial projects. The library is distributed under the MIT license.",
  },
  {
    value: "item-2",
    trigger: "Is there a Figma file available?",
    content:
      "We are currently working on a comprehensive Figma design system that will be released soon to all Honest UI users.",
  },
  {
    value: "item-3",
    trigger: "How do I contribute to Honest UI?",
    content:
      "You can contribute by reporting bugs, suggesting features, or submitting pull requests on our GitHub repository.",
  },
]

export default function AccordionLeadingIcon() {
  return (
    <div className="mx-auto mb-auto w-full max-w-lg">
      <Accordion multiple={false} defaultValue={["item-1"]}>
        {items.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger className="flex-row-reverse items-center justify-end gap-3 py-3 hover:no-underline data-[panel-open]:[&>svg:first-of-type]:rotate-90 [&>svg:last-child]:hidden">
              <span className="font-medium text-foreground/90">
                {item.trigger}
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="ps-7 leading-relaxed text-muted-foreground">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
