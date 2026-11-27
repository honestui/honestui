import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests for the Honest AI generative runtime. Component behavior is
// covered by the Playwright suite.
export default defineConfig({
  resolve: {
    // The package folder has its own React install; one copy must serve every hook.
    dedupe: ["react", "react-dom"],
    // Match the tsconfig paths: this repository builds the honestui package.
    alias: {
      "honestui/icons": fileURLToPath(new URL("./package/honestui/src/icons.ts", import.meta.url)),
      "honestui/charts": fileURLToPath(new URL("./lib/honestui-charts.ts", import.meta.url)),
      "honestui/logos": fileURLToPath(new URL("./package/honestui/src/logos.ts", import.meta.url)),
      "honestui/vectors": fileURLToPath(new URL("./package/honestui/src/vectors.ts", import.meta.url)),
      "honestui/shaders": fileURLToPath(new URL("./lib/honestui-shaders.ts", import.meta.url)),
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: [
      "tests/ai/generative/**/*.test.{ts,tsx}",
      "registry/honest-ai/generative/runtime/**/*.test.{ts,tsx}",
    ],
    environment: "node",
    globals: false,
  },
});
