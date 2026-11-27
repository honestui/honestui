import { NextResponse, type NextRequest } from "next/server";

import { jsonApiError } from "@/lib/api-errors";
import { buildRegistryBaseColor } from "@/lib/init-registry";
import {
  getRegistryCatalog,
  getRegistryIndex,
} from "@/lib/registry-locations";
import { getRegistryItem } from "@/lib/registry";
import {
  getPublicItems as getAiPublicItems,
  getRegistryDependencyUrls as getAiRegistryDependencyUrls,
  getRegistryItem as getAiRegistryItem,
} from "@/lib/ai/registry";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function getPublicRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host =
    forwardedHost || request.headers.get("host") || request.nextUrl.host;
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol =
    forwardedProtocol || request.nextUrl.protocol.replace(/:$/, "");

  return `${protocol}://${host}`;
}

const aiItemNotFound = () =>
  jsonApiError(
    {
      code: "REGISTRY_ITEM_NOT_FOUND",
      message: "Registry item not found",
      resolution: "Use /r/ai/registry.json to find a valid Honest AI registry item name.",
    },
    404,
  );

/** Honest AI items: `/r/ai/registry.json` and `/r/ai/<name>.json`. */
async function getAiRegistryResponse(request: NextRequest, fileName: string) {
  if (!fileName.endsWith(".json")) return aiItemNotFound();
  const name = fileName.slice(0, -".json".length);

  if (name === "registry") {
    return NextResponse.json({
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "Honest AI",
      homepage: `${getPublicRequestOrigin(request)}/docs/ai`,
      items: await getAiPublicItems(),
    });
  }

  const item = await getAiRegistryItem(name);
  if (!item) return aiItemNotFound();

  const registryDependencies = getAiRegistryDependencyUrls(item, getPublicRequestOrigin(request));

  return NextResponse.json({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: item.type,
    ...(item.dependencies.length > 0 && { dependencies: item.dependencies }),
    ...(registryDependencies.length > 0 && { registryDependencies }),
    files: item.files,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;

  if (path.length === 2 && path[0] === "ai") {
    return getAiRegistryResponse(request, path[1]);
  }
  const fileName = path.at(-1);
  const name = fileName?.replace(/\.json$/, "");

  if (path.length === 1 && fileName === "index.json") {
    return NextResponse.json(await getRegistryIndex());
  }

  if (path.length === 1 && fileName === "registry.json") {
    return NextResponse.json(await getRegistryCatalog());
  }

  if (
    (path.at(-2) === "colors" && name) ||
    name?.startsWith("colors-")
  ) {
    return NextResponse.json(buildRegistryBaseColor());
  }

  if (!name) {
    return jsonApiError(
      {
        code: "REGISTRY_ITEM_NOT_FOUND",
        message: "Registry item not found",
        resolution: "Use /r/registry.json to find a valid public registry item name.",
      },
      404,
    );
  }

  const item = await getRegistryItem(name);
  if (!item) {
    return jsonApiError(
      {
        code: "REGISTRY_ITEM_NOT_FOUND",
        message: "Registry item not found",
        resolution: "Use /r/registry.json to find a valid public registry item name.",
      },
      404,
    );
  }

  const registryDependencies = item.registryDependencies?.map(
    (dependency) => `${getPublicRequestOrigin(request)}/r/${dependency}.json`,
  );

  return NextResponse.json({
    ...item,
    ...(registryDependencies?.length && { registryDependencies }),
  });
}
