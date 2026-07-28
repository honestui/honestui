import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const registryDir = path.join(packageRoot, "public", "r");
const registryIndexPath = path.join(registryDir, "registry.json");

const RESERVED_REGISTRY_NAMES = new Set([
  "honestui-ui",
  "typescript-config",
  "eslint-config",
  "patterns",
  "honestui"
]);

const fail = (message) => {
  console.error(`Registry verification failed: ${message}`);
  process.exit(1);
};

const ensureReadable = async (targetPath) => {
  try {
    await access(targetPath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

if (!(await ensureReadable(registryIndexPath))) {
  fail(`missing ${registryIndexPath}`);
}

let index;
try {
  index = JSON.parse(await readFile(registryIndexPath, "utf8"));
} catch (error) {
  fail(`invalid JSON in ${registryIndexPath}: ${String(error)}`);
}

const names = (index.items ?? [])
  .map((item) => item?.name?.trim?.())
  .filter((name) => typeof name === "string" && name.length > 0);

if (names.length === 0) {
  fail("registry.json has no items");
}

const unique = new Set();
const duplicates = new Set();
for (const name of names) {
  if (unique.has(name)) {
    duplicates.add(name);
  }
  unique.add(name);
}

if (duplicates.size > 0) {
  console.warn(
    `Registry verification warning: duplicate names in index: ${Array.from(duplicates)
      .sort()
      .join(", ")}`
  );
}

const reservedNamesInRegistry = names.filter((name) =>
  RESERVED_REGISTRY_NAMES.has(name)
);
if (reservedNamesInRegistry.length > 0) {
  fail(
    `registry contains reserved names: ${reservedNamesInRegistry.sort().join(", ")}`
  );
}

for (const name of unique) {
  const itemPath = path.join(registryDir, `${name}.json`);
  if (!(await ensureReadable(itemPath))) {
    fail(`missing file for registry item "${name}": ${itemPath}`);
  }

  let item;
  try {
    item = JSON.parse(await readFile(itemPath, "utf8"));
  } catch (error) {
    fail(`invalid JSON for registry item "${name}": ${String(error)}`);
  }

  if (typeof item?.name !== "string" || item.name.trim() !== name) {
    fail(`registry file name mismatch for "${name}" (found "${item?.name ?? ""}")`);
  }
}

console.log(
  `Registry verification passed: ${unique.size} items available in ${path.relative(packageRoot, registryDir)}`
);
