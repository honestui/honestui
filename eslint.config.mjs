import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["registry/default/examples/**/*.{ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["package/honestui/src/**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".source/**",
    "out/**",
    "build/**",
    "dist/**",
    "package/honestui/dist/**",
    // The asset catalogs are generated source verified by the HonestUI package
    // typecheck and export tests.
    "package/honestui/src/assets/**",
    // The package registry is copied from the root registry by
    // package/honestui/scripts/copy-registry.mjs. Lint the source copy once.
    "package/honestui/registry/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
