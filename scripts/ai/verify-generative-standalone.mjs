import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root = path.resolve("registry/honest-ai/generative");
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const packages = new Set([
  "react", "react-dom", "zod", "zustand", "openai", "ai", "eve",
  "@ag-ui/core", "@langchain/core", "echarts", "honestui", "date-fns", "next-themes", "react-day-picker", "maplibre-gl", "react-markdown",
]);
const failures = [];
const packageName = (specifier) => specifier.startsWith("@")
  ? specifier.split("/").slice(0, 2).join("/")
  : specifier.split("/")[0];

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "__tests__") await inspect(file);
      continue;
    }
    if (!/\.tsx?$/.test(entry.name) || entry.name.includes(".test.")) continue;
    const source = await readFile(file, "utf8");
    for (const imported of ts.preProcessFile(source, true, true).importedFiles) {
      const specifier = imported.fileName;
      if (specifier.startsWith(".")) {
        const resolved = path.resolve(path.dirname(file), specifier);
        if (!resolved.startsWith(root + path.sep)) failures.push(`${file}: ${specifier}`);
      } else if (specifier.startsWith("@/")) {
        // Honest UI components, Honest AI components and helpers, and shared lib files.
        if (!/^@\/(registry\/default\/(ui|product|animated)|registry\/honest-ai\/(ai|lib)|lib)\//.test(specifier))
          failures.push(`${file}: ${specifier}`);
      } else {
        const name = packageName(specifier);
        // React is a peer dependency of this site's package, not a direct one,
        // and honestui is the package this repository builds.
        const declared = name === "honestui" || [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies].some((group) => group && Object.hasOwn(group, name));
        if (!packages.has(name) || !declared)
          failures.push(`${file}: unapproved dependency ${specifier}`);
      }
    }
  }
}
await inspect(root);
if (failures.length) throw new Error(`Generative source boundary violations:\n${failures.join("\n")}`);
console.log("Generative UI imports stay within local source, Honest components, and declared runtime dependencies.");
