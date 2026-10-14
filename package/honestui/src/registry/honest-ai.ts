import catalog from "../honest-ai/registry-catalog.json"
import { BUILTIN_REGISTRIES } from "./constants"
import { registryItemSchema, registryIndexSchema } from "../schema"
import type { Config } from "../utils/get-config"

export const honestAIRegistryCatalog = registryIndexSchema.parse(catalog)
const names = new Set(honestAIRegistryCatalog.map(item => item.name))

/** Only first-party names resolve to shipped source; URLs and other registries keep their behavior. */
export async function getBundledHonestAIItem(name: string, config?: Config) {
  const itemName = name.startsWith("@honestui/")
    ? name.slice("@honestui/".length)
    : name
  if (!names.has(itemName)) return null
  if (
    config?.registries?.["@honestui"] !== undefined &&
    config.registries["@honestui"] !== BUILTIN_REGISTRIES["@honestui"]
  ) return null
  const { default: items } = await import("../honest-ai/registry-items.json")
  // Return a fresh value so callers cannot mutate the package's registry snapshot.
  return registryItemSchema.parse(structuredClone(items[itemName as keyof typeof items]))
}

export function mergeHonestAICatalog<T extends { name: string }>(items: T[]) {
  return [...items.filter(item => !names.has(item.name)), ...honestAIRegistryCatalog]
}
