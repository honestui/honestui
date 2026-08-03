import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    charts: "src/charts.ts",
    icons: "src/icons.ts",
    shaders: "src/shaders.ts",
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
