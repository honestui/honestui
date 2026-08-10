import { promises as fs } from "node:fs";
import path from "node:path";

export function getRegistryLocations() {
  return [
    {
      path: path.join(process.cwd(), "registry/default/ui"),
      type: "registry:ui" as const,
    },
    {
      path: path.join(process.cwd(), "registry/default/ui/charts"),
      type: "registry:ui" as const,
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
    },
    {
      path: path.join(process.cwd(), "registry/default/examples/animated"),
      type: "registry:example" as const,
    },
    {
      path: path.join(process.cwd(), "registry/default/shaders"),
      type: "registry:component" as const,
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
  const itemsByName = new Map<
    string,
    {
      name: string;
      type: ReturnType<typeof getRegistryLocations>[number]["type"];
    }
  >();

  for (const location of getRegistryLocations()) {
    const entries = await fs.readdir(location.path, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !/\.(?:css|ts|tsx)$/.test(entry.name)) {
        continue;
      }

      const name = entry.name.replace(/\.(?:css|ts|tsx)$/, "");
      if (!itemsByName.has(name)) {
        itemsByName.set(name, { name, type: location.type });
      }
    }
  }

  return Array.from(itemsByName.values()).sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}
