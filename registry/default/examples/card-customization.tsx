import { Card, CardHeader, CardTitle, CardDescription } from "@/registry/default/ui/card"

export default function CardCustomization() {
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
      <Card className="rounded-none border-0 shadow-none">
        <CardHeader>
          <CardTitle>Custom surface</CardTitle>
          <CardDescription>Radius, border, and shadow utilities take priority over the style defaults.</CardDescription>
        </CardHeader>
      </Card>
      <Card variant="soft">
        <CardHeader>
          <CardTitle>Soft surface</CardTitle>
          <CardDescription>A tinted background groups content without an outline.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
