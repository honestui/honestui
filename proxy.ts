import { NextResponse, type NextRequest } from "next/server";

import {
  NEGOTIATED_VARY_HEADER,
  negotiatePageRepresentation,
} from "@/lib/content-negotiation";

const knownPublicPrefixes = [
  "/.well-known/",
  "/_next/",
  "/compare/",
  "/docs/",
  "/examples/",
  "/llm/",
  "/r/",
];

const knownPublicPaths = new Set([
  "/404.md",
  "/apple-icon.png",
  "/favicon.ico",
  "/icon.png",
  "/index.md",
  "/init",
  "/llms-full.txt",
  "/llms.txt",
  "/llm",
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

export function proxy(request: NextRequest) {
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
