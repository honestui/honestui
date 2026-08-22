import { NextResponse, type NextRequest } from "next/server";

import {
  NEGOTIATED_VARY_HEADER,
  negotiatePageRepresentation,
} from "@/lib/content-negotiation";
import { SITE_URL } from "@/lib/utils";
import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_POLICY,
  checkRateLimit,
} from "@/lib/rate-limit";

const knownPublicPrefixes = [
  "/.well-known/",
  "/_next/",
  "/api/",
  "/compare/",
  "/docs/",
  "/examples/",
  "/llm/",
  "/r/",
];

const knownPublicPaths = new Set([
  "/404.md",
  "/about",
  "/apple-icon.png",
  "/contact",
  "/developers",
  "/favicon.ico",
  "/icon.png",
  "/index.md",
  "/init",
  "/llms-full.txt",
  "/llms.txt",
  "/llm",
  "/mcp",
  "/mcp/server-card",
  "/openapi.json",
  "/privacy",
  "/robots.txt",
  "/sitemap.xml",
  "/skill.md",
]);

function isKnownPublicPath(pathname: string) {
  return (
    knownPublicPaths.has(pathname) ||
    knownPublicPrefixes.some(
      (prefix) =>
        pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix),
    ) ||
    /\.(?:avif|css|gif|ico|jpe?g|js|json|map|md|png|svg|webp|woff2?)$/i.test(
      pathname,
    )
  );
}

function rateLimitedResponse(request: NextRequest, retryAfter: number) {
  const headers = new Headers({
    "content-type": "application/problem+json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-api-version": "1",
    "link": `<${SITE_URL}/docs/developers#deprecation-policy>; rel="deprecation"; type="text/html"`,
    "ratelimit-limit": String(RATE_LIMIT_MAX),
    "ratelimit-remaining": "0",
    "ratelimit-policy": RATE_LIMIT_POLICY,
    "retry-after": String(retryAfter),
  });

  return NextResponse.json(
    {
      type: `${SITE_URL}/docs/developers#rate-limit-exceeded`,
      title: "Too many requests",
      status: 429,
      detail:
        "The client exceeded the documented fair-use window for the Honest UI REST API.",
      instance: request.nextUrl.href,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests",
      resolution:
        "Wait for the window in Retry-After to elapse, then resume at the published RateLimit-Policy pace.",
    },
    {
      status: 429,
      headers,
    },
  );
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/v1")) {
    const decision = checkRateLimit(request);
    const response = decision.allowed
      ? NextResponse.next()
      : rateLimitedResponse(request, decision.retryAfter);

    response.headers.set("ratelimit-limit", decision.limit);
    response.headers.set("ratelimit-remaining", decision.remaining);
    response.headers.set("ratelimit-reset", decision.reset);
    response.headers.set("ratelimit-policy", decision.policy);

    return response;
  }

  if (
    (request.method !== "GET" && request.method !== "HEAD") ||
    request.headers.get("accept")?.includes("text/x-component")
  ) {
    return NextResponse.next();
  }

  const representation = negotiatePageRepresentation(
    request.headers.get("accept"),
  );
  const pathname = request.nextUrl.pathname;
  const isNegotiatedPage =
    pathname === "/" ||
    pathname === "/docs" ||
    (pathname.startsWith("/docs/") && !pathname.endsWith(".md"));

  if (!isNegotiatedPage) {
    if (representation === "markdown" && !isKnownPublicPath(pathname)) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/404.md";
      return NextResponse.rewrite(destination);
    }

    return NextResponse.next();
  }

  if (representation === "not-acceptable") {
    return new Response(
      "No acceptable representation is available. Request text/html or text/markdown.\n",
      {
        status: 406,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "vary": NEGOTIATED_VARY_HEADER,
          "x-content-type-options": "nosniff",
        },
      },
    );
  }

  if (representation === "markdown") {
    const destination = request.nextUrl.clone();
    destination.pathname =
      request.nextUrl.pathname === "/"
        ? "/index.md"
        : `/llm${request.nextUrl.pathname.slice("/docs".length)}`;

    return NextResponse.rewrite(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
