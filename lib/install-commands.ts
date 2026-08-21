export const installMethods = ["npm", "yarn", "bun", "pnpm", "shadcn"] as const;

export type InstallMethod = (typeof installMethods)[number];

const honestUiCliCommands: Record<Exclude<InstallMethod, "shadcn">, string> = {
  npm: "npx honestui@latest add",
  yarn: "yarn dlx honestui@latest add",
  bun: "bunx --bun honestui@latest add",
  pnpm: "pnpm dlx honestui@latest add",
};

function normalizeHonestUiItem(item: string) {
  return item.replace(/^@honestui\//, "");
}

export function getComponentInstallCommand(method: InstallMethod, items: string[]) {
  const normalizedItems = items.map(normalizeHonestUiItem);

  if (method === "shadcn") {
    const registryItems = normalizedItems.map((item) => `@honestui/${item}`);
    return `npx shadcn@latest add ${registryItems.join(" ")}`;
  }

  return `${honestUiCliCommands[method]} ${normalizedItems.join(" ")}`;
}
