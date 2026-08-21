import type { NextRequest } from "next/server";

import {
  getVersionedApiResource,
  versionedMethodNotAllowed,
  versionedOptions,
} from "@/lib/versioned-api";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return getVersionedApiResource(request, path);
}

export const POST = versionedMethodNotAllowed;
export const PUT = versionedMethodNotAllowed;
export const PATCH = versionedMethodNotAllowed;
export const DELETE = versionedMethodNotAllowed;

export const OPTIONS = versionedOptions;
