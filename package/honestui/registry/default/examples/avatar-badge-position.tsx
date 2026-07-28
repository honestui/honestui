import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"

const people = [
  {
    src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&dpr=2&q=80",
    alt: "Alex Johnson",
    fallback: "AJ",
    badgeClassName: "top-0 right-0 bg-green-500",
  },
  {
    src: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=96&h=96&dpr=2&q=80",
    alt: "Sarah Chen",
    fallback: "SC",
    badgeClassName: "bg-yellow-500",
  },
  {
    src: "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=96&h=96&dpr=2&q=80",
    alt: "Michael Rodriguez",
    fallback: "MR",
    badgeClassName: "top-0 right-auto left-0 bg-destructive",
  },
  {
    src: "https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=96&h=96&dpr=2&q=80",
    alt: "Emma Wilson",
    fallback: "EW",
    badgeClassName: "right-auto left-0 bg-blue-500",
  },
]

export default function AvatarBadgePosition() {
  return (
    <div className="flex items-center gap-2">
      {people.map((person) => (
        <Avatar key={person.alt} className="relative">
          <AvatarImage src={person.src} alt={person.alt} />
          <AvatarFallback>{person.fallback}</AvatarFallback>
          <AvatarBadge className={person.badgeClassName} />
        </Avatar>
      ))}
    </div>
  )
}
