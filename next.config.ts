import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/docs/shaders/dithering", destination: "/docs/shaders/dither", permanent: true },
      { source: "/docs/animated/animated-button", destination: "/docs/animated", permanent: true },
      { source: "/docs/index", destination: "/docs", permanent: true },
      { source: "/docs/charts/box-plot", destination: "/docs/charts", permanent: true },
      {
        source: "/docs/charts/box-plot/:path*",
        destination: "/docs/charts",
        permanent: true,
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
