import { mkdir, readFile, writeFile } from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { createServer } from "node:http"
import { resolve, extname, sep } from "node:path"
import { pathToFileURL } from "node:url"
import assert from "node:assert/strict"
import { build } from "esbuild"
import { chromium } from "@playwright/test"

const fixture = resolve(".next/prose-syntax-consumer")
await mkdir(fixture, { recursive: true })
const packed = JSON.parse(execFileSync("npm", ["pack", "./packages/prose-syntax", "--json", "--pack-destination", fixture], { encoding: "utf8" }))[0]
await writeFile(`${fixture}/package.json`, JSON.stringify({ name: "syntax-consumer-fixture", private: true, type: "module" }))
execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", `${fixture}/${packed.filename}`], { cwd: fixture, stdio: "pipe" })
let assets = `${fixture}/node_modules/@honestui/prose-syntax/dist`
const { createHighlighter } = await import(pathToFileURL(`${assets}/prose-syntax.js`).href)
const syntax = createHighlighter()
assert.match(await syntax.toHtml('const value = "雪"', { language: "js" }), /prose-syntax-keyword/)
syntax.dispose()
await writeFile(`${fixture}/index.html`, '<!doctype html><html lang="en"><title>Syntax fixture</title><link rel="stylesheet" href="/assets/style.css"><pre data-honest-syntax><code class="language-js">const value = "雪"\n// readable comment</code></pre><script type="module">import { highlightAll } from "/assets/prose-syntax-browser.js"; await highlightAll(document); window.ready = true;</script></html>')
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://localhost").pathname
    const file = pathname === "/" ? `${fixture}/index.html` : resolve(assets, pathname.replace(/^\/assets\//, ""))
    if (pathname !== "/" && !file.startsWith(assets + sep)) { response.writeHead(403).end(); return }
    response.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".wasm": "application/wasm" })[extname(file)] ?? "text/plain")
    response.end(await readFile(file))
  } catch { response.writeHead(404).end() }
})
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.waitForFunction(() => window.ready)
  assert.ok(await page.locator(".prose-syntax-keyword").count())
  const source = await page.locator("code").textContent()
  await page.evaluate(async () => { const syntax = await import('/assets/prose-syntax-browser.js'); await syntax.highlightAll(document) })
  assert.equal(await page.locator("code").textContent(), source)
  assert.equal(await page.locator("code code").count(), 0)
  await page.locator("pre").evaluate(element => element.setAttribute("data-syntax-theme", "dark"))
  assert.equal(await page.locator("pre").evaluate(element => getComputedStyle(element).backgroundColor), "rgb(17, 17, 17)")
  assert.deepEqual(errors, [])
  await page.screenshot({ path: ".next/prose-syntax-standalone.png" })
  if (process.env.SYNTAX_REGISTRY_URL) {
    const root = `${fixture}/registry`
    const visited = new Set()
    async function install(name) {
      if (visited.has(name)) return
      visited.add(name)
      const response = await fetch(`${process.env.SYNTAX_REGISTRY_URL}/r/${name}.json`)
      assert.equal(response.ok, true, name)
      const item = await response.json()
      for (const file of item.files) {
        const target = resolve(root, file.target)
        assert.ok(target.startsWith(root + sep))
        await mkdir(resolve(target, ".."), { recursive: true })
        await writeFile(target, file.content.replaceAll(/@\/lib\/(prose-syntax[\w-]*)/g, "./$1").replace("./prose-syntax-worker.ts", "./prose-syntax-worker.js"))
      }
      for (const dependency of item.registryDependencies ?? []) {
        const match = /\/r\/(prose-syntax[\w-]*)\.json$/.exec(dependency)
        if (match) await install(match[1])
      }
    }
    await install("prose-syntax-browser")
    await install("prose-syntax-theme")
    assets = `${root}/dist`
    await build({ entryPoints: { "prose-syntax-browser": `${root}/lib/prose-syntax-browser.ts`, "prose-syntax-worker": `${root}/lib/prose-syntax-worker.ts` }, outdir: assets, bundle: true, splitting: true, format: "esm", platform: "browser", chunkNames: "chunk-[hash]", minify: true })
    await writeFile(`${assets}/style.css`, await readFile(`${root}/styles/prose-syntax-theme.css`))
    await page.reload()
    await page.waitForFunction(() => window.ready)
    assert.ok(await page.locator(".prose-syntax-keyword").count())
    console.log("Registry files installed into a clean fixture: browser worker and highlighting passed.")
  }
  console.log("Packed npm consumer: core/server, self-hosted browser worker, theme switch, and idempotent DOM enhancement passed.")
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)) }
