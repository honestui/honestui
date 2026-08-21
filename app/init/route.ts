import { NextResponse, type NextRequest } from "next/server";

import { jsonApiError } from "@/lib/api-errors";
import {
  buildRegistryBase,
  parseInitConfig,
} from "@/lib/init-registry";

export async function GET(request: NextRequest) {
  const result = parseInitConfig(request.nextUrl.searchParams);

  if (!result.success) {
    return jsonApiError(
      {
        code: "INVALID_PRESET_CONFIGURATION",
        message: result.error,
        resolution: "Use only the documented values in /openapi.json for preset query parameters.",
      },
      400,
    );
  }

  try {
    return NextResponse.json(
      buildRegistryBase(result.data, request.nextUrl.searchParams.get("only")),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return jsonApiError(
      {
        code: "INVALID_ONLY_VALUE",
        message,
        resolution: "Set only to theme, font, fonts, or a comma-separated combination of those values.",
      },
      400,
    );
  }
}
