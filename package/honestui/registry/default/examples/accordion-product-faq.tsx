import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/registry/default/ui/accordion"

const questions = [
  ["Plan limits", "Seats, projects, and storage can be adjusted from billing settings."],
  ["Exports", "Workspace admins can export reports as CSV at any time."],
  ["Support", "Priority support is included on every team plan."],
]

export default function AccordionProductFaq() {
  return (
    <Accordion className="w-full max-w-md" defaultValue={["exports"]}>
      {questions.map(([title, content]) => (
        <AccordionItem key={title} value={title.toLowerCase().replaceAll(" ", "-")}>
          <AccordionTrigger>{title}</AccordionTrigger>
          <AccordionPanel>{content}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
