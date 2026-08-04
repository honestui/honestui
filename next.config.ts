import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "");
const posthogCloudRegion =
  posthogHost === "https://eu.i.posthog.com"
    ? "eu"
    : posthogHost === "https://us.i.posthog.com"
      ? "us"
      : null;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PostHog's capture endpoints require their trailing slash to be preserved.
  skipTrailingSlashRedirect: true,
  redirects() {
    return [
      {
        source: "/",
        destination: "/docs",
        permanent: false,
      },
    ];
  },
  rewrites() {
    return [
      ...(posthogCloudRegion
        ? [
            {
              source: "/relay/static/:path*",
              destination: `https://${posthogCloudRegion}-assets.i.posthog.com/static/:path*`,
            },
            {
              source: "/relay/array/:path*",
              destination: `https://${posthogCloudRegion}-assets.i.posthog.com/array/:path*`,
            },
            {
              source: "/relay/:path*",
              destination: `${posthogHost}/:path*`,
            },
          ]
        : []),
      {
        source: "/docs.md",
        destination: "/llm",
      },
      {
        source: "/docs/:a.md",
        destination: "/llm/:a",
      },
      {
        source: "/docs/:a/:b.md",
        destination: "/llm/:a/:b",
      },
      {
        source: "/docs/:a/:b/:c.md",
        destination: "/llm/:a/:b/:c",
      },
    ];
  },
};

export default createMDX()(nextConfig);
