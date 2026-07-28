import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/registry/default/ui/avatar"

const people = [
  {
    src: "https://images.unsplash.com/photo-1542595913-85d69b0edbaf?w=96&h=96&dpr=2&q=80",
    alt: "Liam Thompson",
    fallback: "LT",
  },
  {
    src: "https://images.unsplash.com/photo-1485206412256-701ccc5b93ca?w=96&h=96&dpr=2&q=80",
    alt: "Nick Johnson",
    fallback: "NJ",
  },
  {
    src: "https://images.unsplash.com/photo-1620075225255-8c2051b6c015?w=96&h=96&dpr=2&q=80",
    alt: "Maria Garcia",
    fallback: "MG",
  },
  {
    src: "https://github.com/leerob.png",
    alt: "@leerob",
    fallback: "CH",
  },
]

export default function AvatarGroupTrust() {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border p-1 shadow-sm shadow-black/5">
      <AvatarGroup>
        {people.map((person) => (
          <Avatar key={person.alt} className="size-7">
            <AvatarImage src={person.src} alt={person.alt} />
            <AvatarFallback>{person.fallback}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>

      <p className="me-1.5 text-xs text-muted-foreground">
        Trusted by <span className="font-semibold text-foreground">100K+</span>{" "}
        users.
      </p>
    </div>
  )
}
