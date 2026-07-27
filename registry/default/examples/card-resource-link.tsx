import { BookOpen as BookOpenIcon, Link as LinkIcon } from "love-ui/icons"

import { Card, CardContent } from "@/registry/default/ui/card"

const item = {
  label: "Documentation",
  description:
    "Find guides, API references, and examples to integrate with our platform.",
  link: "View docs",
  icon: <BookOpenIcon aria-hidden="true" />,
}

export default function CardResourceLink() {
  return (
    <Card className="w-full max-w-xs p-0">
      <CardContent className="p-0">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2 text-muted-foreground [&_svg]:size-4">
            {item.icon}
            <span className="text-sm font-medium text-foreground">
              {item.label}
            </span>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <LinkIcon aria-hidden="true" className="size-2.5 shrink-0" />
            {item.link}
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
