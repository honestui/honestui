import { UserPlus as UserPlusIcon } from "love-ui/icons"

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/registry/default/ui/avatar"

const people = [
  {
    src: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=96&h=96&dpr=2&q=80",
    alt: "sarah@example.com",
    fallback: "SC",
  },
  {
    src: "https://github.com/maxleiter.png",
    alt: "@maxleiter",
    fallback: "ML",
  },
  {
    src: "https://github.com/evilrabbit.png",
    alt: "@evilrabbit",
    fallback: "ER",
  },
]

export default function AvatarEmptyCollaborators() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <AvatarGroup>
        {people.map((person) => (
          <Avatar key={person.alt}>
            <AvatarImage
              src={person.src}
              alt={person.alt}
              className="grayscale"
            />
            <AvatarFallback>{person.fallback}</AvatarFallback>
          </Avatar>
        ))}
        <AvatarGroupCount aria-label="Add collaborator">
          <UserPlusIcon aria-hidden="true" />
        </AvatarGroupCount>
      </AvatarGroup>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium">No active collaborators</h3>
        <p className="text-xs text-muted-foreground">
          Invite teammates to start working together.
        </p>
      </div>
    </div>
  )
}
