import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"

const people = [
  ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop", "AK"],
  ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop", "JL"],
  ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop", "MC"],
]

export default function AvatarTeamStack() {
  return (
    <div className="flex items-center -space-x-2">
      {people.map(([src, fallback]) => (
        <Avatar key={fallback} className="ring-2 ring-background">
          <AvatarImage src={src} alt="Team member" />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      ))}
      <div className="flex size-10 items-center justify-center rounded-full border bg-muted text-sm font-medium ring-2 ring-background">
        +4
      </div>
    </div>
  )
}
