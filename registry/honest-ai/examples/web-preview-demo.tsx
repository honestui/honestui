"use client"

import { WebPreview, type WebPreviewLog } from "@/registry/honest-ai/ai/web-preview"

const page = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; font: 14px/1.5 system-ui, sans-serif; color: #18181b; background: #fafafa; }
      main { max-width: 520px; margin: 0 auto; padding: 40px 24px; }
      .eyebrow { color: #71717a; font-size: 12px; letter-spacing: .04em; text-transform: uppercase; }
      h1 { margin: 6px 0 8px; font-size: 26px; letter-spacing: -.02em; }
      p { margin: 0 0 20px; color: #52525b; }
      .row { display: flex; gap: 8px; flex-wrap: wrap; }
      input { flex: 1 1 200px; padding: 9px 12px; border: 1px solid #e4e4e7; border-radius: 10px; font: inherit; background: #fff; }
      button { padding: 9px 16px; border: 0; border-radius: 10px; font: inherit; font-weight: 500; color: #fff; background: #18181b; }
    </style>
  </head>
  <body>
    <main>
      <div class="eyebrow">Waitlist</div>
      <h1>Ship invoices in one click</h1>
      <p>Join the early access list. We will email you when your workspace is ready.</p>
      <form class="row" onsubmit="event.preventDefault(); this.querySelector('button').textContent = 'Added'">
        <input type="email" placeholder="you@company.com" aria-label="Email" />
        <button type="submit">Join</button>
      </form>
    </main>
  </body>
</html>`

const logs: WebPreviewLog[] = [
  { level: "info", time: "12:04:31", message: "[vite] connected." },
  { level: "log", time: "12:04:31", message: "Rendered <Waitlist /> in 4ms" },
  { level: "warn", time: "12:04:32", message: "Image is missing an alt attribute: hero.png" },
]

export default function WebPreviewDemo() {
  return (
    <div className="w-full max-w-2xl min-w-0">
      <WebPreview url="http://localhost:5173/waitlist" title="Waitlist page preview" srcDoc={page} height={300} logs={logs} />
    </div>
  )
}
