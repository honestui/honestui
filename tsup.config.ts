import { defineConfig } from "tsup";

export default defineConfig({
  tsconfig: "tsconfig.package.json",
  entry: {
    index: "package/index.ts",
    charts: "package/charts.ts",
    icons: "package/icons.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "honestui/icons",
  ],
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      "@": process.cwd(),
    };
  },
});
