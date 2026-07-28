import { CloudUpload as UploadCloudIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/registry/default/ui/empty"

export default function EmptyUploadQueue() {
  return (
    <Empty className="border-dashed border">
      <EmptyHeader>
        <EmptyMedia variant="icon"><UploadCloudIcon /></EmptyMedia>
        <EmptyTitle>No files queued</EmptyTitle>
        <EmptyDescription>Drop assets here or browse from your computer.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><Button size="sm">Upload files</Button></EmptyContent>
    </Empty>
  )
}
