import { describe, expect, it } from "vitest"
import { configWithDefaults } from "./config"
import { getBundledHonestAIItem, honestAIRegistryCatalog, mergeHonestAICatalog } from "./honest-ai"
import { getRegistryItems, resolveRegistryItems } from "./api"

describe("shipped Honest AI registry", () => {
  it("resolves bare and first-party names without fetching the AI site", async () => {
    const [bare, namespaced] = await getRegistryItems(["prompt-bar", "@honestui/prompt-bar"])
    expect(bare).toEqual(namespaced)
    expect(bare.files?.[0].target).toBe("components/ai/prompt-bar.tsx")
    expect(bare.files?.[0].content).toContain("@/components/ui/button")
    expect(bare.registryDependencies).toContain("@honestui/button")
  })

  it("validates every item and keeps the local dependency graph closed", async () => {
    for (const entry of honestAIRegistryCatalog) {
      const item = await getBundledHonestAIItem(entry.name)
      expect(item?.name).toBe(entry.name)
      expect(item?.files?.length).toBeGreaterThan(0)
      expect(item?.registryDependencies?.every(name => name.startsWith("@honestui/")) ?? true).toBe(true)
      for (const file of item?.files ?? []) {
        expect(file.target).toBeTruthy()
        expect(file.content).not.toMatch(/@\/registry\//)
      }
    }
  })

  it("resolves Markdown, styles, syntax, and the worker as an installation tree", async () => {
    const markdown = await getBundledHonestAIItem("markdown")
    expect(markdown?.registryDependencies).toEqual(expect.arrayContaining(["@honestui/prose", "@honestui/prose-syntax-theme"]))
    const client = await getBundledHonestAIItem("prose-syntax-client")
    expect(client?.registryDependencies).toContain("@honestui/prose-syntax-worker")
    const tree = await resolveRegistryItems(["prose-syntax-react", "prose-tailwind", "repair-markdown"])
    expect(tree?.files?.map(file => file.target)).toEqual(expect.arrayContaining([
      "lib/prose-syntax-react.tsx", "lib/prose-syntax-client.ts", "lib/prose-syntax-worker.ts", "styles/prose-syntax-theme.css", "lib/prose-tailwind.ts", "lib/repair-markdown.ts",
    ]))
  })

  it("preserves URL, unrelated registry, and custom registry resolution", async () => {
    expect(await getBundledHonestAIItem("https://example.com/prompt-bar.json")).toBeNull()
    expect(await getBundledHonestAIItem("@other/prompt-bar")).toBeNull()
    expect(await getBundledHonestAIItem("button")).toBeNull()
    expect(await getBundledHonestAIItem("prompt-bar", configWithDefaults({ registries: { "@honestui": "https://example.com/{name}.json" } }))).toBeNull()
  })

  it("returns fresh source and merges discovery without duplicate names", async () => {
    const item = await getBundledHonestAIItem("prompt-bar")
    item!.files![0].content = "changed"
    expect((await getBundledHonestAIItem("prompt-bar"))?.files?.[0].content).not.toBe("changed")
    const merged = mergeHonestAICatalog([{ name: "button" }, { name: "prompt-bar" }])
    expect(merged.filter(item => item.name === "prompt-bar")).toHaveLength(1)
    expect(merged.map(item => item.name)).toEqual(expect.arrayContaining(["button", "generative-ui", "prose", "prose-syntax"]))
  })
})
