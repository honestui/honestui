import { promises as fs } from "node:fs";
import path from "node:path";
import type { Registry } from "shadcn/schema";

const registryCatalogHiddenItems = new Set(["use-prefers-reduced-motion"]);

export function getRegistryLocations() {
  return [
    {
      path: path.join(process.cwd(), "registry/default/ui"),
      type: "registry:ui" as const,
      includeInCatalog: true,
    },
    {
      path: path.join(process.cwd(), "registry/default/ui/charts"),
      type: "registry:ui" as const,
      includeInCatalog: true,
    },
    {
      path: path.join(process.cwd(), "registry/default/product"),
      type: "registry:component" as const,
      includeInCatalog: true,
      directoriesAsItems: true,
    },
    {
      path: path.join(process.cwd(), "registry/default/examples"),
      type: "registry:example" as const,
    },
    {
      path: path.join(process.cwd(), "registry/default/examples/charts"),
      type: "registry:example" as const,
    },
    {
      path: path.join(process.cwd(), "registry/default/animated"),
      type: "registry:component" as const,
      includeInCatalog: true,
    },
    {
      path: path.join(process.cwd(), "registry/default/examples/animated"),
      type: "registry:example" as const,
    },
    {
      path: path.join(process.cwd(), "registry/default/shaders"),
      type: "registry:component" as const,
      includeInCatalog: true,
    },
    {
      path: path.join(process.cwd(), "registry/default/examples/shaders"),
      type: "registry:example" as const,
    },
    {
      path: path.join(process.cwd(), "lib/hooks"),
      type: "registry:hook" as const,
    },
    {
      path: path.join(process.cwd(), "lib"),
      type: "registry:lib" as const,
    },
  ];
}

export async function getRegistryIndex() {
  const items = await collectRegistryItems(getRegistryLocations());

  return items.filter((item) => item.name !== "registry");
}

export async function getRegistryCatalog(): Promise<Registry> {
  const publicLocations = getRegistryLocations().filter(
    (location) => location.includeInCatalog,
  );
  const items = (await collectRegistryItems(publicLocations)).filter(
    (item) => !registryCatalogHiddenItems.has(item.name),
  );

  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "honestui",
    homepage: "https://www.honestui.com",
    items,
  };
}

async function collectRegistryItems(
  locations: ReturnType<typeof getRegistryLocations>,
) {
  const itemsByName = new Map<
    string,
    {
      name: string;
      type: ReturnType<typeof getRegistryLocations>[number]["type"];
    }
  >();

  const addItem = (
    name: string,
    type: ReturnType<typeof getRegistryLocations>[number]["type"],
  ) => {
    if (!itemsByName.has(name)) {
      itemsByName.set(name, { name, type });
    }
  };

  for (const location of locations) {
    const entries = await fs.readdir(location.path, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && location.directoriesAsItems) {
        const hasEntryFile = await fs
          .access(path.join(location.path, entry.name, `${entry.name}.tsx`))
          .then(() => true)
          .catch(() => false);

        if (hasEntryFile) {
          addItem(entry.name, location.type);
        }
        continue;
      }

      if (!entry.isFile() || !/\.(?:css|ts|tsx)$/.test(entry.name)) {
        continue;
      }

      addItem(entry.name.replace(/\.(?:css|ts|tsx)$/, ""), location.type);
    }
  }

  return Array.from(itemsByName.values()).sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}
