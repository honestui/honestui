import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createServer } from "node:http"
import { readFile, writeFile, mkdir, mkdtemp, rm, realpath } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { fileURLToPath, pathToFileURL } from "node:url"
import { chromium } from "@playwright/test"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const packageRoot = path.resolve(root, "../honestui/package/honestui")
const { build } = await import(pathToFileURL(path.join(packageRoot, "node_modules/vite/dist/node/index.js")))
await mkdir(path.join(root, ".next"), { recursive: true })
const fixture = await realpath(await mkdtemp(path.join(os.tmpdir(), "honestui-browser-consumer-")))
let browser, server
try {
  const [packed] = JSON.parse(execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", fixture], { cwd: packageRoot, encoding: "utf8" }))
  await writeFile(path.join(fixture, "package.json"), JSON.stringify({ private: true, type: "module" }))
  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", path.join(fixture, packed.filename)], { cwd: fixture, stdio: "pipe" })
  await writeFile(path.join(fixture, "index.html"), '<!doctype html><html lang="en" class="light" data-theme="light" data-style="modern"><title>HonestUI package consumer</title><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:var(--hui-color-background-base-primary);color:var(--hui-color-foreground-base-primary);font-family:var(--hui-font-body)"><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>')
  await writeFile(path.join(fixture, "main.tsx"), `
    import * as React from "react"
    import { createRoot } from "react-dom/client"
    import { PromptBar } from "honestui/ai/prompt-bar"
    import { Markdown } from "honestui/ai/markdown"
    import { SyntaxCode } from "honestui/syntax/react"
    import { Renderer, honestChatLibrary } from "honestui/genui"
    import { GenerativeChat, agUIAdapter, EventType } from "honestui/genui/chat"
    import "honestui/theme.css"
    import "honestui/ai.css"
    import "honestui/prose.css"
    import "honestui/syntax.css"
    const llm = {
      streamProtocol: agUIAdapter(),
      send: async ({ messages }) => {
        const input = messages.findLast(message => message.role === "user").content
        const reply = 'Package reply: ' + input + '\\n\\n\x60\x60\x60honestai\\nroot = Stack([echo])\\necho = Callout("info", "Package generated reply", "Streaming works")\\n\x60\x60\x60'
        const id = crypto.randomUUID()
        return new Response([
          { type: EventType.TEXT_MESSAGE_START, messageId: id, role: "assistant" },
          { type: EventType.TEXT_MESSAGE_CONTENT, messageId: id, delta: reply },
          { type: EventType.TEXT_MESSAGE_END, messageId: id },
        ].map(event => 'data: ' + JSON.stringify(event) + '\\n\\n').join(''), { headers: { "Content-Type": "text/event-stream" } })
      },
    }
    function App() {
      const [sent, setSent] = React.useState("")
      return <main style={{maxWidth: 720, margin: "24px auto", padding: 16}}>
        <section id="prompt"><PromptBar placeholder="Ask the package" onSubmit={({text}) => setSent(text)} /><output>{sent}</output></section>
        <section id="syntax"><SyntaxCode code={'const answer = 42'} language="javascript" /></section>
        <section id="markdown"><Markdown>{'# Package Markdown\\n\\nA **rendered** reply.'}</Markdown></section>
        <section id="genui"><Renderer response={'root = Stack([Callout("info", "Package renderer", "Generated UI works")])'} library={honestChatLibrary} /></section>
        <section id="chat" style={{height: 500}}><GenerativeChat llm={llm} label="Package chat" /></section>
      </main>
    }
    createRoot(document.getElementById("root")).render(<App />)
  `)
  await build({ root: fixture, configFile: false, logLevel: "error", worker: { format: "es" }, build: { outDir: "browser", target: "es2023", minify: false } })
  const assets = path.join(fixture, "browser")
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname)
      const file = path.resolve(assets, pathname === "/" ? "index.html" : `.${pathname}`)
      if (!file.startsWith(assets + path.sep)) { response.writeHead(403).end(); return }
      response.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".wasm": "application/wasm" })[path.extname(file)] ?? "text/plain")
      response.end(await readFile(file))
    } catch { response.writeHead(404).end() }
  })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.locator("#prompt textarea").fill("Hello package")
  await page.locator("#prompt").getByRole("button", { name: "Send", exact: true }).click()
  await page.waitForFunction(() => document.querySelector("#prompt output").textContent === "Hello package")
  await page.waitForFunction(() => document.querySelector("#syntax .prose-syntax-keyword"))
  assert.ok(await page.locator("#syntax .prose-syntax-constant").count())
  assert.equal(await page.locator('[data-slot="prompt-bar"] > div').first().evaluate(element => getComputedStyle(element).borderRadius), "12px")
  assert.equal(await page.locator("#markdown h1").textContent(), "Package Markdown")
  assert.ok(await page.locator("#genui").getByText("Generated UI works", { exact: true }).count())
  await page.locator("#chat textarea").fill("Hello GenUI")
  await page.locator("#chat").getByRole("button", { name: "Send", exact: true }).click()
  await page.locator("#chat").getByText("Package generated reply", { exact: true }).waitFor()
  assert.ok(await page.locator("#chat").getByText("Streaming works", { exact: true }).count())
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark"
    document.documentElement.className = "dark"
  })
  await page.waitForFunction(() => getComputedStyle(document.querySelector("#syntax pre")).backgroundColor === "rgb(17, 17, 17)")
  const surfaceColor = await page.evaluate(() => {
    const surface = document.createElement("div")
    surface.style.backgroundColor = "var(--hui-color-background-base-primary)"
    document.body.append(surface)
    const color = getComputedStyle(surface).backgroundColor
    surface.remove()
    return color
  })
  await page.waitForFunction(expected => getComputedStyle(document.querySelector('[data-slot="prompt-bar"] > div')).backgroundColor === expected, surfaceColor)
  assert.notEqual(await page.locator("#prompt textarea").evaluate(element => getComputedStyle(element).color), "rgb(0, 0, 0)")
  assert.deepEqual(errors, [])
  await page.screenshot({ path: path.join(root, ".next/honestui-package-consumer.png"), fullPage: true })
  console.log("Packed Vite consumer passed: prompt submission, Markdown, syntax worker, generated UI, chat streaming, and theme styles.")
} finally {
  await browser?.close()
  if (server) await new Promise(resolve => server.close(resolve))
  await rm(fixture, { recursive: true, force: true })
}
