import { NextResponse, type NextRequest } from "next/server";

import {
  buildRegistryBase,
  buildRegistryBaseColor,
  parseInitConfig,
} from "@/lib/init-registry";
import {
  getRegistryCatalog,
  getRegistryIndex,
} from "@/lib/registry-locations";
import { getRegistryItem } from "@/lib/registry";
import { absoluteUrl } from "@/lib/utils";

export const API_VERSION = "1";
export const API_BASE_PATH = `/api/v${API_VERSION}`;
export const API_POLICY_PATH = "/docs/developers#deprecation-policy";

type ApiProblemCode =
  | "API_METHOD_NOT_ALLOWED"
  | "API_ROUTE_NOT_FOUND"
  | "INVALID_ONLY_VALUE"
  | "INVALID_PRESET_CONFIGURATION"
  | "REGISTRY_ITEM_NOT_FOUND";

type ApiProblem = {
  code: ApiProblemCode;
  detail: string;
  resolution: string;
  status: number;
  title: string;
  typeSlug: string;
};

function versionHeaders(headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("x-api-version", API_VERSION);
  responseHeaders.set(
    "link",
    `<${absoluteUrl(API_POLICY_PATH)}>; rel="deprecation"; type="text/html"`,
  );
  responseHeaders.set("x-content-type-options", "nosniff");
  return responseHeaders;
}

export function versionedJson(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: versionHeaders(init.headers),
  });
}

export function versionedApiProblem(
  request: NextRequest,
  problem: ApiProblem,
  headers?: HeadersInit,
) {
  const responseHeaders = versionHeaders(headers);
  responseHeaders.set("content-type", "application/problem+json; charset=utf-8");

  return NextResponse.json(
    {
      type: absoluteUrl(`/docs/developers#${problem.typeSlug}`),
      title: problem.title,
      status: problem.status,
      detail: problem.detail,
      instance: request.nextUrl.href,
      code: problem.code,
      message: problem.title,
      resolution: problem.resolution,
    },
    {
      status: problem.status,
      headers: responseHeaders,
    },
  );
}

export function getVersionedApiIndex() {
  return versionedJson({
    name: "Honest UI Registry API",
    version: `v${API_VERSION}`,
    description:
      "Public, read-only endpoints for Honest UI registry discovery and initialization presets.",
    authentication: "none",
    documentation: absoluteUrl("/docs/developers"),
    openapi: absoluteUrl("/openapi.json"),
    resources: {
      registry: absoluteUrl(`${API_BASE_PATH}/registry`),
      registryIndex: absoluteUrl(`${API_BASE_PATH}/registry/index`),
      initializationPreset: absoluteUrl(`${API_BASE_PATH}/init`),
    },
  });
}

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

async function getVersionedRegistryItem(request: NextRequest, name: string) {
  const item = await getRegistryItem(name);

  if (!item) {
    return versionedApiProblem(request, {
      code: "REGISTRY_ITEM_NOT_FOUND",
      detail: `No public Honest UI registry item is named "${name}".`,
      resolution: `GET ${API_BASE_PATH}/registry to find a valid item name.`,
      status: 404,
      title: "Registry item not found",
      typeSlug: "registry-item-not-found",
    });
  }

  const registryDependencies = item.registryDependencies?.map(
    (dependency) =>
      `${getPublicRequestOrigin(request)}${API_BASE_PATH}/registry/${dependency}`,
  );

  return versionedJson({
    ...item,
    ...(registryDependencies?.length && { registryDependencies }),
  });
}

function getVersionedInitializationPreset(request: NextRequest) {
  const result = parseInitConfig(request.nextUrl.searchParams);

  if (!result.success) {
    return versionedApiProblem(request, {
      code: "INVALID_PRESET_CONFIGURATION",
      detail: result.error,
      resolution:
        "Use only the query parameter values documented in /openapi.json.",
      status: 400,
      title: "Invalid preset configuration",
      typeSlug: "invalid-preset-configuration",
    });
  }

  try {
    return versionedJson(
      buildRegistryBase(result.data, request.nextUrl.searchParams.get("only")),
    );
  } catch (error) {
    return versionedApiProblem(request, {
      code: "INVALID_ONLY_VALUE",
      detail: error instanceof Error ? error.message : "The only value is invalid.",
      resolution:
        "Set only to theme, font, fonts, or a comma-separated combination of those values.",
      status: 400,
      title: "Invalid registry subset",
      typeSlug: "invalid-only-value",
    });
  }
}

export async function getVersionedApiResource(
  request: NextRequest,
  path: string[],
) {
  if (path.length === 1 && path[0] === "registry") {
    return versionedJson(await getRegistryCatalog());
  }

  if (path.length === 2 && path[0] === "registry" && path[1] === "index") {
    return versionedJson(await getRegistryIndex());
  }

  if (path.length === 2 && path[0] === "registry") {
    return getVersionedRegistryItem(request, path[1]);
  }

  if (path.length === 2 && path[0] === "colors") {
    return versionedJson(buildRegistryBaseColor());
  }

  if (path.length === 1 && path[0] === "init") {
    return getVersionedInitializationPreset(request);
  }

  return versionedApiProblem(request, {
    code: "API_ROUTE_NOT_FOUND",
    detail: `No Honest UI API v${API_VERSION} route matches ${request.nextUrl.pathname}.`,
    resolution: `Start at ${API_BASE_PATH} or inspect /openapi.json for supported routes.`,
    status: 404,
    title: "API route not found",
    typeSlug: "api-route-not-found",
  });
}

export function versionedMethodNotAllowed(request: NextRequest) {
  return versionedApiProblem(
    request,
    {
      code: "API_METHOD_NOT_ALLOWED",
      detail: `${request.method} is not supported for this read-only resource.`,
      resolution: "Use GET for the documented resource.",
      status: 405,
      title: "Method not allowed",
      typeSlug: "method-not-allowed",
    },
    { allow: "GET, HEAD" },
  );
}

export function versionedOptions() {
  return new Response(null, {
    status: 204,
    headers: versionHeaders({ allow: "GET, HEAD, OPTIONS" }),
  });
}
