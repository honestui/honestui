import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
