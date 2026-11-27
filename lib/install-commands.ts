export const installMethods = ["npm", "yarn", "bun", "pnpm", "shadcn"] as const;

export type InstallMethod = (typeof installMethods)[number];

const honestUiCliCommands: Record<Exclude<InstallMethod, "shadcn">, string> = {
  npm: "npx honestui@latest add",
  yarn: "yarn dlx honestui@latest add",
  bun: "bunx --bun honestui@latest add",
  pnpm: "pnpm dlx honestui@latest add",
};

/**
 * Honest AI items are written `@honestai/<name>`. The honestui CLI ships them
 * and resolves them by name; shadcn installs them from their registry URL.
 */
export const AI_REGISTRY_URL = "https://www.honestui.com/r/ai";

const AI_PREFIX = "@honestai/";

function normalizeHonestUiItem(item: string) {
  return item.replace(/^@honestui\//, "");
}

export function getComponentInstallCommand(method: InstallMethod, items: string[]) {
  const targets = items.map((item) => {
    if (item.startsWith(AI_PREFIX)) {
      const name = item.slice(AI_PREFIX.length);
      return method === "shadcn" ? `${AI_REGISTRY_URL}/${name}.json` : name;
    }
    const name = normalizeHonestUiItem(item);
    return method === "shadcn" ? `@honestui/${name}` : name;
  });

  if (method === "shadcn") return `npx shadcn@latest add ${targets.join(" ")}`;

  return `${honestUiCliCommands[method]} ${targets.join(" ")}`;
}
