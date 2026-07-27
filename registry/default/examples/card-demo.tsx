import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/registry/default/ui/card"
import { Field, FieldControl, FieldLabel } from "@/registry/default/ui/field"
import { Form } from "@/registry/default/ui/form"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"

const frameworkOptions = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
]

export default function CardDemo() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>
          Deploy your new project in one-click.
        </CardDescription>
      </CardHeader>
      <Form className="grid gap-6">
        <CardPanel>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldControl
                type="text"
                placeholder="Name of your project"
              />
            </Field>
            <Field>
              <FieldLabel>Framework</FieldLabel>
              <Select items={frameworkOptions} defaultValue="next">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {frameworkOptions.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
          </div>
        </CardPanel>
        <CardFooter>
          <Button className="w-full" type="submit">
            Deploy
          </Button>
        </CardFooter>
      </Form>
    </Card>
  )
}
