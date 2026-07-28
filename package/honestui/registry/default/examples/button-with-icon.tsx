import { Download as DownloadIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"

export default function ButtonWithIcon() {
  return (
    <Button>
      <DownloadIcon />
      Download
    </Button>
  )
}
