import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const packageJson = JSON.parse(
  await readFile(path.join(packageRoot, "package.json"), "utf8")
)
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "honestui-artifact-"))

try {
  const { stdout } = await execFileAsync(
    "npm",
    ["pack", "--ignore-scripts", "--json", "--pack-destination", tempRoot],
    { cwd: packageRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  )
  const [packResult] = JSON.parse(stdout)
  const packedFiles = new Set(packResult.files.map((file) => file.path))
  const requiredFiles = [
    "README.md",
    "CHANGELOG.md",
    "package.json",
    "dist/index.js",
    "dist/src/index.d.ts",
    "dist/charts.js",
    "dist/src/charts.d.ts",
    "dist/charts.css",
    "dist/density.css",
    "dist/icons.js",
    "dist/src/icons.d.ts",
    "dist/logos.js",
    "dist/src/logos.d.ts",
    "dist/vectors.js",
    "dist/src/vectors.d.ts",
    "dist/shaders.js",
    "dist/src/shaders.d.ts",
    "dist/AI_THIRD_PARTY_NOTICES.txt",
    "dist/syntax-worker.js",
  ]

  for (const requiredFile of requiredFiles) {
    assert.ok(packedFiles.has(requiredFile), `Packed package is missing ${requiredFile}`)
  }
  for (const [entry, definition] of Object.entries(packageJson.exports)) {
    if (entry.includes("*")) continue
    for (const target of typeof definition === "string" ? [definition] : Object.values(definition)) {
      assert.ok(packedFiles.has(target.replace(/^\.\//, "")), `Packed export ${entry} is missing ${target}`)
    }
  }
  assert.ok(
    Array.from(packedFiles).every((file) => !file.includes("tailwind.css")),
    "Packed package must not contain a package-level tailwind.css file"
  )
  assert.ok(
    !packedFiles.has("dist/shaders.css"),
    "Packed shaders must not require a separate stylesheet"
  )

  await writeFile(
    path.join(tempRoot, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
    "utf8"
  )
  const tarballPath = path.join(tempRoot, packResult.filename)
  await execFileAsync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarballPath, `typescript@${packageJson.devDependencies.typescript}`, `@types/react@${packageJson.devDependencies["@types/react"]}`, `@types/react-dom@${packageJson.devDependencies["@types/react-dom"]}`],
    { cwd: tempRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  )
  await writeFile(
    path.join(tempRoot, "smoke.mjs"),
    `
      import assert from "node:assert/strict"
      const before = [process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")]
      const root = await import("honestui")
      const charts = await import("honestui/charts")
      const icons = await import("honestui/icons")
      const logos = await import("honestui/logos")
      const vectors = await import("honestui/vectors")
      const shaders = await import("honestui/shaders")
      assert.equal(typeof root.getRegistry, "function")
      assert.ok(charts.BarChart && icons.Search && logos.Vercel && vectors.Abstract1Shapes && shaders.LightRays)
      assert.deepEqual([process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")], before)
      const ai = await import("honestui/ai")
      const prompt = await import("honestui/ai/prompt-bar")
      const prose = await import("honestui/prose")
      const syntax = await import("honestui/syntax")
      const genui = await import("honestui/genui")
      const chat = await import("honestui/genui/chat")
      const server = await import("honestui/genui/server")
      const openai = await import("honestui/genui/server/openai")
      const vercel = await import("honestui/genui/server/vercel")
      assert.ok(ai.PromptBar && prompt.PromptBar && prose.proseTailwind && genui.Renderer && genui.honestLibrary && chat.GenerativeChat)
      assert.equal(typeof openai.createAutofix, "function")
      assert.equal(typeof vercel.createAutofix, "function")
      const parser = server.createParser(server.honestChatSpec.schema, server.honestChatSpec.root)
      assert.ok(parser)
      const highlighter = syntax.createHighlighter()
      const result = await highlighter.highlight("const answer = 42", { language: "javascript" })
      assert.ok(result.lines.flat().some(token => token.role !== "plain"))
      highlighter.dispose()
      const [item] = await root.getRegistryItems(["prompt-bar"])
      assert.equal(item.files[0].target, "components/ai/prompt-bar.tsx")
      const tree = await root.resolveRegistryItems(["prose-syntax-react"])
      assert.ok(tree.files.some(file => file.target === "lib/prose-syntax-worker.ts"))
      const { createElement } = await import("react")
      const { renderToStaticMarkup } = await import("react-dom/server")
      assert.match(renderToStaticMarkup(createElement(prompt.PromptBar, { placeholder: "Ask something", onSubmit: () => {} })), /Ask something/)
    `,
    "utf8"
  )
  await execFileAsync(process.execPath, [path.join(tempRoot, "smoke.mjs")], {
    cwd: tempRoot,
    encoding: "utf8",
  })

  const installedPackageJson = JSON.parse(
    await readFile(path.join(tempRoot, "node_modules", "honestui", "package.json"), "utf8")
  )
  assert.equal(installedPackageJson.version, packageJson.version)
  await writeFile(path.join(tempRoot, "consumer.tsx"), `
    import { PromptBar } from "honestui/ai/prompt-bar"
    import { Markdown } from "honestui/ai"
    import { SyntaxCode } from "honestui/syntax/react"
    import { createHighlighter } from "honestui/syntax"
    import { Renderer, honestChatLibrary } from "honestui/genui"
    import { GenerativeChat, type GenerativeChatProps } from "honestui/genui/chat"
    import { createParser, honestChatSpec } from "honestui/genui/server"
    import { createAutofix } from "honestui/genui/server/openai"
    import { proseTailwind, repairMarkdown } from "honestui/prose"
    createParser(honestChatSpec.schema, honestChatSpec.root)
    createAutofix({ library: honestChatSpec })
    createHighlighter().highlight("const value = 1", { language: "javascript" })
    export const example = <><PromptBar onSubmit={({ text }) => console.log(text)} /><Markdown>{repairMarkdown("Hello")}</Markdown><SyntaxCode code="const value = 1" language="javascript" /><Renderer response='root = Stack([Text("Hello")])' library={honestChatLibrary} /><div className={proseTailwind}>Prose</div></>
    export function Chat(props: GenerativeChatProps) { return <GenerativeChat {...props} /> }
  `)
  await writeFile(path.join(tempRoot, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2023", module: "ESNext", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, skipLibCheck: true, noEmit: true }, include: ["consumer.tsx"] }))
  await execFileAsync(process.execPath, [path.join(tempRoot, "node_modules/typescript/bin/tsc"), "-p", path.join(tempRoot, "tsconfig.json")], { cwd: tempRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })
  const cli = path.join(tempRoot, "node_modules/honestui/dist/index.js")
  const { stdout: viewed } = await execFileAsync(process.execPath, [cli, "view", "prompt-bar", "-c", tempRoot], { cwd: tempRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })
  assert.equal(JSON.parse(viewed)[0].name, "prompt-bar")
  await mkdir(path.join(tempRoot, "src"), { recursive: true })
  await writeFile(path.join(tempRoot, "src/app.css"), '@import "tailwindcss";\n')
  await writeFile(path.join(tempRoot, "components.json"), JSON.stringify({ style: "new-york-v4", rsc: false, tsx: true, tailwind: { config: "", css: "src/app.css", baseColor: "neutral", cssVariables: true }, aliases: { components: "@/components", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks", utils: "@/lib/utils" } }))
  await writeFile(path.join(tempRoot, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2023", module: "ESNext", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, skipLibCheck: true, noEmit: true, baseUrl: ".", paths: { "@/*": ["src/*"] } } }))
  const { stdout: preview } = await execFileAsync(process.execPath, [cli, "add", "prose-syntax-react", "--dry-run", "--yes", "-c", tempRoot], { cwd: tempRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })
  assert.match(preview, /prose-syntax-react/)
  assert.match(preview, /prose-syntax-worker/)
  console.log(`Verified packed honestui@${packageJson.version}: exports, AI rendering, syntax, GenUI, and registry dependencies.`)
} finally {
  await rm(tempRoot, { force: true, recursive: true })
}
