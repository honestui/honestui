import { NextResponse, type NextRequest } from "next/server";

import { jsonApiError } from "@/lib/api-errors";
import { buildRegistryBaseColor } from "@/lib/init-registry";
import {
  getRegistryCatalog,
  getRegistryIndex,
} from "@/lib/registry-locations";
import { getRegistryItem } from "@/lib/registry";

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

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
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
