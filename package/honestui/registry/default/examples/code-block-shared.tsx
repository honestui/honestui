"use client"

export type CodeSample = {
  code: string
  filename?: string
  language?: string
}

export function CodeBlockShowcase({
  files,
}: {
  files: CodeSample[]
  lineNumbers?: boolean
  highlighter?: "plain" | "shiki" | "sugar-high"
  hideHeader?: boolean
}) {
  return (
    <div className="w-full max-w-2xl rounded-lg border bg-background">
      {files.map((file) => (
        <div key={file.filename ?? file.code} className="border-b last:border-b-0">
          {file.filename && (
            <div className="border-b px-3 py-2 font-mono text-xs text-muted-foreground">
              {file.filename}
            </div>
          )}
          <pre className="overflow-x-auto p-4 text-left text-sm">
            <code>{file.code}</code>
          </pre>
        </div>
      ))}
    </div>
  )
}
