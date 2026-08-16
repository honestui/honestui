import { registryItemSchema, registrySchema } from "shadcn/schema";

const configuredBaseUrl =
  process.argv[2] ?? process.env.REGISTRY_BASE_URL ?? "http://localhost:3000";
const baseUrl = new URL(configuredBaseUrl);
const failures = [];

async function fetchJson(pathname) {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, { redirect: "follow" });
  let data;

  try {
    data = await response.json();
  } catch {
    failures.push(`${pathname}: response was not valid JSON`);
  }

  if (!/^application\/json\b/i.test(response.headers.get("content-type") ?? "")) {
    failures.push(`${pathname}: response was not application/json`);
  }

  return { data, status: response.status, url: response.url };
}

let indexResponse;
try {
  indexResponse = await fetchJson("/r/index.json");
} catch (error) {
  console.error(
    `Could not reach ${baseUrl.href}: ${
      error instanceof Error ? error.message : error
    }`,
  );
  process.exit(1);
}

if (indexResponse.status !== 200) {
  failures.push(`/r/index.json: returned ${indexResponse.status}`);
}

if (!Array.isArray(indexResponse.data)) {
  failures.push("/r/index.json: expected an array of registry items");
} else {
  const names = indexResponse.data.map((item) => item?.name);
  const uniqueNames = new Set(names);

  if (names.length !== uniqueNames.size) {
    failures.push("/r/index.json: contains duplicate item names");
  }

  const button = indexResponse.data.find((item) => item?.name === "button");
  if (button?.type !== "registry:ui") {
    failures.push("/r/index.json: missing the button registry:ui item");
  }
}

const catalogResponse = await fetchJson("/r/registry.json");
let catalogItems = [];

if (catalogResponse.status !== 200) {
  failures.push(`/r/registry.json: returned ${catalogResponse.status}`);
} else {
  const catalogResult = registrySchema.safeParse(catalogResponse.data);

  if (!catalogResult.success) {
    failures.push(
      `/r/registry.json: ${catalogResult.error.issues
        .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
        .join("; ")}`,
    );
  } else {
    catalogItems = catalogResult.data.items ?? [];
    const catalogNames = catalogItems.map((item) => item.name);

    if (catalogResult.data.name !== "honestui") {
      failures.push('/r/registry.json: expected name "honestui"');
    }
    if (catalogResult.data.homepage !== "https://www.honestui.com") {
      failures.push(
        '/r/registry.json: expected homepage "https://www.honestui.com"',
      );
    }
    if (!catalogNames.includes("button") || !catalogNames.includes("light-rays")) {
      failures.push("/r/registry.json: missing required public items");
    }
    if (catalogNames.includes("use-prefers-reduced-motion")) {
      failures.push(
        "/r/registry.json: exposes the internal reduced-motion support item",
      );
    }
    if (
      catalogItems.some(
        (item) => item.type === "registry:example" || item.type === "registry:lib",
      )
    ) {
      failures.push("/r/registry.json: exposes examples or internal libraries");
    }
    if (
      catalogItems.some((item) =>
        item.files?.some((file) => "content" in file),
      )
    ) {
      failures.push("/r/registry.json: catalog files must not include content");
    }
  }
}

const queuedItemUrls = catalogItems.map(
  (item) => new URL(`/r/${item.name}.json`, catalogResponse.url).href,
);
const visitedItemUrls = new Set();
let catalogCursor = 0;
async function validateNextCatalogItem() {
  while (catalogCursor < queuedItemUrls.length) {
    const itemUrl = queuedItemUrls[catalogCursor++];
    if (visitedItemUrls.has(itemUrl)) continue;
    visitedItemUrls.add(itemUrl);

    const response = await fetchJson(itemUrl);

    if (response.status !== 200) {
      failures.push(`${itemUrl}: returned ${response.status}`);
      continue;
    }

    const result = registryItemSchema.safeParse(response.data);
    if (!result.success) {
      failures.push(
        `${itemUrl}: ${result.error.issues[0]?.message ?? "invalid registry item"}`,
      );
      continue;
    }

    const resolvedItemUrl = new URL(response.url);
    for (const dependency of result.data.registryDependencies ?? []) {
      const dependencyUrl = new URL(dependency, resolvedItemUrl);
      if (
        dependencyUrl.origin === resolvedItemUrl.origin &&
        dependencyUrl.pathname.startsWith("/r/") &&
        !visitedItemUrls.has(dependencyUrl.href)
      ) {
        queuedItemUrls.push(dependencyUrl.href);
      }
    }
  }
}

await Promise.all(Array.from({ length: 8 }, validateNextCatalogItem));

const buttonResponse = await fetchJson("/r/button.json");
if (buttonResponse.status !== 200) {
  failures.push(`/r/button.json: returned ${buttonResponse.status}`);
} else if (
  buttonResponse.data?.name !== "button" ||
  buttonResponse.data?.type !== "registry:ui"
) {
  failures.push("/r/button.json: returned an invalid button registry item");
}

const supportResponse = await fetchJson("/r/use-prefers-reduced-motion.json");
const supportResult = registryItemSchema.safeParse(supportResponse.data);
if (supportResponse.status !== 200 || !supportResult.success) {
  failures.push(
    "/r/use-prefers-reduced-motion.json: returned an invalid registry item",
  );
} else if (
  supportResult.data.files?.length !== 1 ||
  supportResult.data.files[0]?.target !==
    "components/shaders/use-prefers-reduced-motion.ts"
) {
  failures.push(
    "/r/use-prefers-reduced-motion.json: expected one shader support file",
  );
}

const shaderResponse = await fetchJson("/r/light-rays.json");
const shaderResult = registryItemSchema.safeParse(shaderResponse.data);
if (shaderResponse.status !== 200 || !shaderResult.success) {
  failures.push("/r/light-rays.json: returned an invalid registry item");
} else {
  const expectedSupportUrl = new URL(
    "/r/use-prefers-reduced-motion.json",
    shaderResponse.url,
  ).toString();
  if (!shaderResult.data.registryDependencies?.includes(expectedSupportUrl)) {
    failures.push(
      "/r/light-rays.json: missing the reduced-motion registry dependency",
    );
  }
}

const missingResponse = await fetchJson("/r/does-not-exist.json");
if (missingResponse.status !== 404) {
  failures.push(`/r/does-not-exist.json: returned ${missingResponse.status}`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `Validated the registry index, ${catalogItems.length} catalog items with ${visitedItemUrls.size - catalogItems.length} support dependencies, shader support, and missing-item response at ${baseUrl.href}`,
);
