import { NextResponse, type NextRequest } from "next/server";

import {
  buildRegistryBase,
  parseInitConfig,
} from "@/lib/init-registry";

export async function GET(request: NextRequest) {
  const result = parseInitConfig(request.nextUrl.searchParams);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    return NextResponse.json(
      buildRegistryBase(result.data, request.nextUrl.searchParams.get("only")),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
