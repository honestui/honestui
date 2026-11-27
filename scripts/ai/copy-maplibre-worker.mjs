// MapLibre builds its worker from a URL at runtime, which bundlers cannot
// follow, so the worker and the module it imports are served from public/.
// The folder is versioned so a new release never meets a cached old worker.
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "node_modules/maplibre-gl/dist");
const { version } = JSON.parse(
  await readFile(path.join(root, "node_modules/maplibre-gl/package.json"), "utf8"),
);
const target = path.join(root, "public/vendor/maplibre-gl", version);
const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

if (process.argv.includes("--check")) {
  for (const file of files) {
    const [served, installed] = await Promise.all([
      readFile(path.join(target, file)).catch(() => null),
      readFile(path.join(source, file)),
    ]);
    if (!served?.equals(installed))
      throw new Error(`Copy the MapLibre worker with npm run maps:worker (${file} is missing or stale)`);
  }
  console.log(`The MapLibre ${version} worker matches the installed package.`);
} else {
  await mkdir(target, { recursive: true });
  await Promise.all(files.map((file) => copyFile(path.join(source, file), path.join(target, file))));
  console.log(`Copied the MapLibre ${version} worker to public/vendor/maplibre-gl/${version}.`);
}
