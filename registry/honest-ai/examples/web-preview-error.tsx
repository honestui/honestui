"use client"

import { WebPreview } from "@/registry/honest-ai/ai/web-preview"

export default function WebPreviewError() {
  return (
    <div className="w-full max-w-2xl min-w-0">
      <WebPreview
        url="http://localhost:5173/checkout"
        title="Checkout page preview"
        srcDoc=""
        status="error"
        error="The dev server stopped responding on port 5173."
        height={240}
        canGoBack
      />
    </div>
  )
}
