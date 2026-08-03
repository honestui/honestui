import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    charts: "src/charts.ts",
    icons: "src/icons.ts",
    logos: "src/logos.ts",
    shaders: "src/shaders.ts",
    vectors: "src/vectors.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@react-three/fiber",
    "@react-three/postprocessing",
    "ogl",
    "postprocessing",
    "three",
  ],
})
