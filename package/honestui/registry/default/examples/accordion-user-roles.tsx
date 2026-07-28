import { Badge } from "@/registry/default/ui/badge"
import { Frame, FramePanel } from "@/registry/default/ui/frame"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/default/ui/accordion"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"

const users = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex@apple.com",
    role: "Admin",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&dpr=2&q=80",
    initials: "AJ",
    content:
      "Alex has full administrative access to the platform, including billing management, user provisioning, and security configurations.",
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "sarah@openai.com",
    role: "Viewer",
    avatar:
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=96&h=96&dpr=2&q=80",
    initials: "SC",
    content:
      "Sarah has read-only access to projects and reports. She cannot modify settings or invite new members.",
  },
  {
    id: "3",
    name: "Michael Rodriguez",
    email: "michael@meta.com",
    role: "Editor",
    avatar:
      "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=96&h=96&dpr=2&q=80",
    initials: "MR",
    content:
      "Michael is part of the design team and has permissions to edit projects, manage assets, and update design system components.",
  },
]

export default function AccordionUserRoles() {
  return (
    <div className="mx-auto mb-auto w-full max-w-lg">
      <Frame className="gap-1">
        {users.map((user) => (
          <FramePanel key={user.id} className="p-3">
            <Accordion
              multiple={false}
              defaultValue={["1"]}
              className="border-none"
            >
              <AccordionItem
                value={user.id}
                className="border-none bg-transparent p-0"
              >
                <AccordionTrigger className="items-center px-1 py-1 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 border">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="inline-flex items-center gap-2">
                      <span className="font-semibold tracking-tight text-foreground/90">
                        {user.name}
                      </span>
                      <Badge
                        variant={user.role === "Admin" ? "success" : "secondary"}
                        size="sm"
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="py-0 pl-11 text-muted-foreground">
                  {user.content}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </FramePanel>
        ))}
      </Frame>
    </div>
  )
}
