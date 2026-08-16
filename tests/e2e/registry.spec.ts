import { expect, test, type APIRequestContext } from "@playwright/test";
import { registryItemSchema, registrySchema } from "shadcn/schema";

async function validateCatalogItems(
  request: APIRequestContext,
  items: Array<{ name: string }>,
) {
  const failures: string[] = [];
  const queuedPaths = items.map((item) => `/r/${item.name}.json`);
  const visitedPaths = new Set<string>();
  let cursor = 0;

  async function validateNextItem() {
    while (cursor < queuedPaths.length) {
      const pathname = queuedPaths[cursor++];
      if (visitedPaths.has(pathname)) continue;
      visitedPaths.add(pathname);

      const response = await request.get(pathname);

      if (!response.ok()) {
        failures.push(`${pathname}: HTTP ${response.status()}`);
        continue;
      }

      const result = registryItemSchema.safeParse(await response.json());
      if (!result.success) {
        failures.push(`${pathname}: ${result.error.issues[0]?.message}`);
        continue;
      }

      const itemUrl = new URL(response.url());
      for (const dependency of result.data.registryDependencies ?? []) {
        const dependencyUrl = new URL(dependency, itemUrl);
        if (
          dependencyUrl.origin === itemUrl.origin &&
          dependencyUrl.pathname.startsWith("/r/") &&
          !visitedPaths.has(dependencyUrl.pathname)
        ) {
          queuedPaths.push(dependencyUrl.pathname);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: 8 }, validateNextItem));
  return failures;
}

test("publishes a curated shadcn registry catalog", async ({ request }) => {
  const response = await request.get("/r/registry.json");
  expect(response.ok()).toBe(true);

  const result = registrySchema.safeParse(await response.json());
  expect(result.success).toBe(true);
  if (!result.success) return;

  const items = result.data.items ?? [];
  const names = items.map((item) => item.name);

  expect(result.data).toMatchObject({
    name: "honestui",
    homepage: "https://www.honestui.com",
  });
  expect(names).toContain("button");
  expect(names).toContain("light-rays");
  expect(names).not.toContain("use-prefers-reduced-motion");
  expect(items).not.toContainEqual(
    expect.objectContaining({ type: "registry:example" }),
  );
  expect(items).not.toContainEqual(
    expect.objectContaining({ type: "registry:lib" }),
  );
  expect(JSON.stringify(items)).not.toContain('"content"');
  expect(await validateCatalogItems(request, items)).toEqual([]);
});

test("publishes shader support files without requiring matching CSS", async ({
  request,
}) => {
  const supportResponse = await request.get(
    "/r/use-prefers-reduced-motion.json",
  );
  expect(supportResponse.ok()).toBe(true);

  const supportResult = registryItemSchema.safeParse(
    await supportResponse.json(),
  );
  expect(supportResult.success).toBe(true);
  if (!supportResult.success) return;

  expect(supportResult.data.files).toHaveLength(1);
  expect(supportResult.data.files?.[0]).toMatchObject({
    path: "use-prefers-reduced-motion.ts",
    target: "components/shaders/use-prefers-reduced-motion.ts",
    type: "registry:component",
  });

  const shaderResponse = await request.get("/r/light-rays.json");
  expect(shaderResponse.ok()).toBe(true);
  const shaderResult = registryItemSchema.safeParse(await shaderResponse.json());
  expect(shaderResult.success).toBe(true);
  if (!shaderResult.success) return;

  expect(shaderResult.data.registryDependencies).toContain(
    new URL(
      "/r/use-prefers-reduced-motion.json",
      shaderResponse.url(),
    ).toString(),
  );
});
