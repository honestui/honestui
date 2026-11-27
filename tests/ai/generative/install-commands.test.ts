import { describe, expect, it } from "vitest";
import { getComponentInstallCommand } from "@/lib/install-commands";

describe("Honest UI package installation commands", () => {
  it.each([
    ["npm", "npx honestui@latest add"],
    ["yarn", "yarn dlx honestui@latest add"],
    ["bun", "bunx --bun honestui@latest add"],
    ["pnpm", "pnpm dlx honestui@latest add"],
  ] as const)("uses shipped item names for %s", (method, prefix) => {
    expect(getComponentInstallCommand(method, ["@honestai/prompt-bar", "@honestai/generative-chat", "@honestai/prose", "@honestai/prose-syntax-react", "@honestui/button"]))
      .toBe(`${prefix} prompt-bar generative-chat prose prose-syntax-react button`);
  });

  it("keeps registry URLs for shadcn, which does not ship these items", () => {
    expect(getComponentInstallCommand("shadcn", ["@honestai/prompt-bar", "@honestui/button"]))
      .toBe("npx shadcn@latest add https://www.honestui.com/r/ai/prompt-bar.json @honestui/button");
  });
});
