import { Search as SearchIcon } from "honestui/icons"

import { Input } from "@/registry/default/ui/input"

export default function InputSearchInline() {
  return (
    <div className="relative w-full max-w-xs">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="ps-9" placeholder="Search projects" type="search" />
    </div>
  )
}
