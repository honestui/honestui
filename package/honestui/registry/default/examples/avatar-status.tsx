import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar";

const people = [
  {
    src: "https://images.unsplash.com/photo-1485206412256-701ccc5b93ca?w=96&h=96&dpr=2&q=80",
    alt: "Nick Johnson",
    fallback: "NJ",
    badgeClassName: "bg-primary",
    status: "Available",
  },
  {
    src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&dpr=2&q=80",
    alt: "Alex Johnson",
    fallback: "AJ",
    badgeClassName: "bg-green-500",
    status: "Available",
  },
  {
    src: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=96&h=96&dpr=2&q=80",
    alt: "Sarah Chen",
    fallback: "SC",
    badgeClassName: "bg-yellow-500",
    status: "Away",
  },
  {
    src: "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=96&h=96&dpr=2&q=80",
    alt: "Michael Rodriguez",
    fallback: "MR",
    badgeClassName: "bg-destructive",
    status: "Do not disturb",
  },
];

export default function AvatarStatus() {
  return (
    <ul className="grid gap-3">
      {people.map((person) => (
        <li key={person.alt} className="flex items-center gap-3">
          <Avatar className="relative">
            <AvatarImage src={person.src} alt="" />
            <AvatarFallback>{person.fallback}</AvatarFallback>
            <AvatarBadge className={person.badgeClassName} aria-hidden="true" />
          </Avatar>
          <span className="text-sm">
            <span className="block font-medium">{person.alt}</span>
            <span className="text-muted-foreground">{person.status}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
