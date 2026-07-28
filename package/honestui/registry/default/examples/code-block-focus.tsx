"use client"

import { CodeBlockShowcase, type CodeSample } from "./code-block-shared"

const code: CodeSample[] = [
  {
    language: "ts",
    filename: "discount.ts",
    code: `export function calculateDiscount(price: number, percentage: number) {
  const discount = price * (percentage / 100);
  const finalPrice = price - discount; // focus line
  return Number(finalPrice.toFixed(2));
}`,
  },
  {
    language: "js",
    filename: "discount.js",
    code: `export function calculateDiscount(price, percentage) {
  const discount = price * (percentage / 100);
  const finalPrice = price - discount; // focus line
  return Number(finalPrice.toFixed(2));
}`,
  },
]

const Example = () => <CodeBlockShowcase files={code} lineNumbers />

export default Example
