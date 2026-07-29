import { Plus as PlusIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"

export default function ButtonAppearances() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button appearance="flat" size="xl">
          <PlusIcon />
          Flat
        </Button>
        <Button appearance="glossy" size="xl">
          <PlusIcon />
          Glossy
        </Button>
        <Button appearance="glow" size="xl">
          <PlusIcon />
          Glow
        </Button>
        <Button appearance="bevel" size="xl">
          <PlusIcon />
          Bevel
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button appearance="flat" size="xl" variant="destructive">
          <PlusIcon />
          Flat
        </Button>
        <Button appearance="glossy" size="xl" variant="destructive">
          <PlusIcon />
          Glossy
        </Button>
        <Button appearance="glow" size="xl" variant="destructive">
          <PlusIcon />
          Glow
        </Button>
        <Button appearance="bevel" size="xl" variant="destructive">
          <PlusIcon />
          Bevel
        </Button>
      </div>
    </div>
  )
}
