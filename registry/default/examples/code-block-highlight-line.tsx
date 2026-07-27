"use client"

import { CodeBlockShowcase, type CodeSample } from "./code-block-shared"

const code: CodeSample[] = [
  {
    language: "tsx",
    filename: "pricing.ts",
    code: `export function getDiscountedPrice(price: number, percent: number) {
  const discount = price * (percent / 100); // highlighted line
  const total = price - discount;
  return Math.max(total, 0);
}`,
  },
  {
    language: "js",
    filename: "pricing.js",
    code: `export function getDiscountedPrice(price, percent) {
  const discount = price * (percent / 100); // highlighted line
  const total = price - discount;
  return Math.max(total, 0);
}`,
  },
]

const Example = () => <CodeBlockShowcase files={code} lineNumbers />

export default Example
