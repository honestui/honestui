import { constants } from "node:fs";
import { access, copyFile, cp, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");
const sourceRegistryRoot = path.join(repoRoot, "registry");
const targetRegistryRoot = path.join(packageRoot, "registry");

await access(sourceRegistryRoot, constants.R_OK);

const sourceFiles = await collectFiles(sourceRegistryRoot);
const sourceFileSet = new Set(sourceFiles);
const preservedRegistryTempRoot = await mkdtemp(
  path.join(os.tmpdir(), "honestui-registry-")
);
const preservedRegistryFiles = [];

try {
  await access(targetRegistryRoot, constants.R_OK);
  await cp(targetRegistryRoot, preservedRegistryTempRoot, {
    recursive: true,
    force: true
  });

  for (const file of await collectFiles(preservedRegistryTempRoot)) {
    if (!sourceFileSet.has(file)) {
      preservedRegistryFiles.push(file);
    }
  }
} catch {
  // The package registry may not exist on a fresh build.
}

await rm(targetRegistryRoot, { recursive: true, force: true });
await mkdir(path.dirname(targetRegistryRoot), { recursive: true });
await cp(sourceRegistryRoot, targetRegistryRoot, {
  recursive: true,
  force: true
});

for (const file of preservedRegistryFiles) {
  const sourceFile = path.join(preservedRegistryTempRoot, file);
  const targetFile = path.join(targetRegistryRoot, file);

  await mkdir(path.dirname(targetFile), { recursive: true });
  await copyFile(sourceFile, targetFile);
}

const targetFiles = await collectFiles(targetRegistryRoot);
const expectedRegistryFiles = new Set([
  ...sourceFiles,
  ...preservedRegistryFiles
]);

await rm(preservedRegistryTempRoot, { recursive: true, force: true });

if (expectedRegistryFiles.size !== targetFiles.length) {
  throw new Error(
    `Registry copy mismatch: expected ${expectedRegistryFiles.size} files, copied ${targetFiles.length}`
  );
}

console.log(`Copied ${sourceFiles.length} registry files into ${path.relative(repoRoot, targetRegistryRoot)}`);

async function collectFiles(root, options = {}, baseRoot = root) {
  const files = [];
  const entries = await readdir(root, { withFileTypes: true });
  const ignoredNames = options.ignoredNames ?? new Set();

  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) continue;

    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await collectFiles(fullPath, options, baseRoot);
      files.push(...nestedFiles);
      continue;
    }

    if (entry.isFile()) {
      files.push(path.relative(baseRoot, fullPath));
    }
  }

  return files;
}
