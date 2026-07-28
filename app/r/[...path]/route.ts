import { NextResponse, type NextRequest } from "next/server";

import { getRegistryItem } from "@/lib/registry";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const fileName = path.at(-1);
  const name = fileName?.replace(/\.json$/, "");

  if (!name) {
    return NextResponse.json({ error: "Registry item not found" }, { status: 404 });
  }

  const item = await getRegistryItem(name);
  if (!item) {
    return NextResponse.json({ error: "Registry item not found" }, { status: 404 });
  }

  const registryDependencies = item.registryDependencies?.map(
    (dependency) => `${request.nextUrl.origin}/r/${dependency}.json`,
  );

  return NextResponse.json({
    ...item,
    ...(registryDependencies?.length && { registryDependencies }),
  });
}
