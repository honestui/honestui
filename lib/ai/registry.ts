import { promises as fs } from "node:fs";
import path from "node:path";

import { getGenerativeRegistryItem, generativeRegistryNames } from "./generative-registry";
import { AiIndex as Index } from "@/registry/honest-ai/index";

const registryRoot = path.join(process.cwd(), "registry/honest-ai");

/** Where each kind of registry file lives here, and where it installs in a project. */
const locations = [
  { directory: "ai", extensions: [".tsx"], type: "registry:component", targetDirectory: "components/ai", isPublic: true },
  { directory: "lib", extensions: [".ts", ".tsx"], type: "registry:lib", targetDirectory: "lib", isPublic: true },
  { directory: "styles", extensions: [".css"], type: "registry:file", targetDirectory: "styles", isPublic: true },
  { directory: "examples", extensions: [".tsx"], type: "registry:example", targetDirectory: "components", isPublic: false },
] as const;

/**
 * Stylesheets an item needs. A component names a stylesheet's classes without
 * importing the file, so this cannot be read from its imports.
 */
const styleDependencies: Record<string, string[]> = {
  markdown: ["prose", "prose-syntax-theme"],
  "prose-syntax-react": ["prose-syntax-theme"],
  "prose-syntax-codemirror": ["prose-syntax-theme"],
  "prose-syntax-client": ["prose-syntax-worker"],
  "streaming-text": ["prose"],
};

// Consumers import KaTeX's stylesheet directly, so it must be a direct package
// dependency even in package managers that isolate transitive dependencies.
const packageDependencies: Record<string, string[]> = {
  "markdown-math": ["katex"],

};

export type RegistryItem = {
  name: string;
  type: (typeof locations)[number]["type"];
  /** npm packages the file imports. */
  dependencies: string[];
  /** Honest UI registry items the file imports, by name. */
  honestUiDependencies: string[];
  /** Items from this registry the file imports, by name. */
  localDependencies: string[];
  files: { path: string; type: string; target: string; content: string }[];
};

export function getRegistryComponent(name: string) {
  return Index[name]?.component;
}

export async function getRegistryItem(name: string): Promise<RegistryItem | null> {
  if (!/^[a-z0-9-]+$/.test(name)) return null;

  const generativeItem = await getGenerativeRegistryItem(name, getDependencies, toInstalledImports);
  if (generativeItem) return generativeItem;

  for (const location of locations) {
    for (const extension of location.extensions) {
      const fileName = `${name}${extension}`;
      const source = await fs
        .readFile(path.join(registryRoot, location.directory, fileName), "utf-8")
        .catch(() => null);
      if (source === null) continue;

      const { dependencies, honestUiDependencies, localDependencies } =
        extension === ".css" ? noDependencies : getDependencies(source);

      return {
        name,
        type: location.type,
        dependencies: [...new Set([...dependencies, ...(packageDependencies[name] ?? [])])].map(dependency => name === "prose-syntax" && dependency === "shiki" ? "shiki@4.3.1" : dependency).sort(),
        honestUiDependencies,
        localDependencies: [...localDependencies, ...(styleDependencies[name] ?? [])].sort(),
        files: [
          {
            path: fileName,
            type: location.type,
            target: `${location.targetDirectory}/${fileName}`,
            content: toInstalledImports(source),
          },
        ],
      };
    }
  }

  return null;
}

/** The installable items and their types, for the registry catalog. */
export async function getPublicItems() {
  const items: Pick<RegistryItem, "name" | "type">[] = [];

  for (const location of locations.filter((item) => item.isPublic)) {
    const entries = await fs.readdir(path.join(registryRoot, location.directory));
    for (const entry of entries) {
      const extension = location.extensions.find((candidate) => entry.endsWith(candidate));
      if (extension) items.push({ name: entry.slice(0, -extension.length), type: location.type });
    }
  }

  items.push(...generativeRegistryNames.map(name => ({ name, type: "registry:lib" as const })));
  return items.sort((first, second) => first.name.localeCompare(second.name));
}

/**
 * The absolute registry URL for each item a file depends on, as a CLI needs
 * them. Honest UI items are served from `/r`, Honest AI items from `/r/ai`.
 */
export function getRegistryDependencyUrls(item: RegistryItem, origin: string) {
  return [
    ...item.honestUiDependencies.map((dependency) => `${origin}/r/${dependency}.json`),
    ...item.localDependencies.map((dependency) => `${origin}/r/ai/${dependency}.json`),
  ];
}

/** In this repo, items import each other from `registry`. Installed, they sit in `components/ai` and `lib`. */
function toInstalledImports(source: string) {
  return source.replaceAll("@/registry/default/product/", "@/components/ui/").replaceAll("@/registry/default/ui/", "@/components/ui/").replaceAll("@/registry/default/animated/", "@/components/animated/").replaceAll("@/registry/honest-ai/generative/", "@/lib/generative/").replaceAll("@/registry/honest-ai/ai/", "@/components/ai/").replaceAll("@/registry/honest-ai/lib/", "@/lib/");
}

const noDependencies = { dependencies: [], honestUiDependencies: [], localDependencies: [] };

function getDependencies(source: string) {
  const dependencies = new Set<string>();
  const honestUiDependencies = new Set<string>();
  const localDependencies = new Set<string>();

  // Anchored to an import or re-export statement, so a quoted word in a type or a comment is not read as a module.
  const importPattern = /^\s*(?:import|export)\s[^;="']*?\bfrom\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm;
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];

    if (specifier.startsWith("@/registry/honest-ai/ai/") || specifier.startsWith("@/registry/honest-ai/lib/")) {
      localDependencies.add(path.basename(specifier));
    } else if (
      specifier.startsWith("@/registry/default/product/") ||
      specifier.startsWith("@/registry/default/ui/") ||
      specifier.startsWith("@/registry/default/animated/") ||
      (specifier.startsWith("@/lib/") && specifier !== "@/lib/utils")
    ) {
      honestUiDependencies.add(path.basename(specifier));
    } else if (
      !specifier.startsWith("@/") &&
      !specifier.startsWith(".") &&
      specifier !== "react" &&
      !specifier.startsWith("react/") &&
      specifier !== "next" &&
      !specifier.startsWith("next/")
    ) {
      dependencies.add(specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]);
    }
  }

  return {
    dependencies: [...dependencies].sort(),
    honestUiDependencies: [...honestUiDependencies].sort(),
    localDependencies: [...localDependencies].sort(),
  };
}
