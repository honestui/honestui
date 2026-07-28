import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"

export default function CardTeamMember() {
  return (
    <Card className="w-full max-w-xs gap-5">
      <CardHeader className="flex flex-row items-start gap-4">
        <Avatar className="size-12 border">
          <AvatarImage
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=96&h=96&fit=crop"
            alt="Riley Scott"
          />
          <AvatarFallback>RS</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>Riley Scott</CardTitle>
              <p className="text-sm text-muted-foreground">Product lead</p>
            </div>
            <Badge variant="success">Online</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Owns onboarding, activation, and roadmap planning for the growth
          product team.
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">Strategy</Badge>
          <Badge variant="secondary">Research</Badge>
          <Badge variant="secondary">Roadmap</Badge>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button className="flex-1" size="sm">
          Message
        </Button>
        <Button className="flex-1" variant="outline" size="sm">
          Profile
        </Button>
      </CardFooter>
    </Card>
  )
}
