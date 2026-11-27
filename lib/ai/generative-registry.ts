import { promises as fs } from "node:fs";
import path from "node:path";
import type { RegistryItem } from "./registry";
const bundles: Record<
  string,
  { directories: string[]; files: string[]; dependencies: string[] }
> = {
  "generative-ui": {
    directories: [
      "catalog",
      "renderers",
      "runtime/core",
      "runtime/react",
      "runtime/observability",
    ],
    files: ["index.ts", "LICENSE", "spec.json", "chat-spec.json"],
    dependencies: [],
  },
  "generative-chat": {
    directories: ["runtime/headless"],
    files: ["chat.tsx", "user-message.tsx", "LICENSE"],
    dependencies: ["generative-ui"],
  },
  "generative-server": {
    directories: ["runtime/server"],
    files: ["LICENSE"],
    dependencies: ["generative-ui"],
  },
};
export const generativeRegistryNames = Object.keys(bundles);
export async function getGenerativeRegistryItem(
  name: string,
  readDependencies: (
    source: string,
  ) => Pick<
    RegistryItem,
    "dependencies" | "honestUiDependencies" | "localDependencies"
  >,
  transform: (source: string) => string,
): Promise<RegistryItem | null> {
  const bundle = bundles[name];
  if (!bundle) return null;
  const root = path.join(process.cwd(), "registry/honest-ai/generative");
  async function collect(directory: string): Promise<string[]> {
    const entries = await fs.readdir(path.join(root, directory), {
      withFileTypes: true,
    });
    const nested = await Promise.all(
      entries.map((entry) =>
        entry.name === "__tests__" || entry.name.includes(".test.")
          ? []
          : entry.isDirectory()
            ? collect(`${directory}/${entry.name}`)
            : /\.(tsx?|md)$/.test(entry.name)
              ? [`${directory}/${entry.name}`]
              : [],
      ),
    );
    return nested.flat();
  }
  const paths = [
    ...bundle.files,
    ...(await Promise.all(bundle.directories.map(collect))).flat(),
  ].sort();
  const dependencies = new Set<string>();
  const honestUiDependencies = new Set<string>();
  const localDependencies = new Set(bundle.dependencies);
  const files = await Promise.all(
    paths.map(async (file) => {
      const source = await fs.readFile(path.join(root, file), "utf8");
      const found = readDependencies(source);
      found.dependencies.forEach((dependency) => dependencies.add(dependency));
      found.honestUiDependencies.forEach((dependency) =>
        honestUiDependencies.add(dependency),
      );
      found.localDependencies.forEach((dependency) =>
        localDependencies.add(dependency),
      );
      return {
        path: `generative/${file}`,
        type: "registry:lib",
        target: `lib/generative/${file}`,
        content: transform(source),
      };
    }),
  );
  return {
    name,
    type: "registry:lib",
    dependencies: [...dependencies].sort(),
    honestUiDependencies: [...honestUiDependencies].sort(),
    localDependencies: [...localDependencies].sort(),
    files,
  };
}
