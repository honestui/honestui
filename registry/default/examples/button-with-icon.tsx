import { Download as DownloadIcon } from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"

export default function ButtonWithIcon() {
  return (
    <Button>
      <DownloadIcon />
      Download
    </Button>
  )
}
