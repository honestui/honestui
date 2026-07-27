"use client"

import { CodeBlockShowcase, type CodeSample } from "./code-block-shared"

const code: CodeSample[] = [
  {
    language: "ts",
    filename: "utils.ts",
    code: `function calculateTotal(items: Array<{ price: number; quantity: number }>) {
- let total = 0;
+ let subtotal = 0;

  for (const item of items) {
-   total += item.price * item.quantity;
+   subtotal += item.price * item.quantity;
  }

- return total;
+ return subtotal;
}`,
  },
  {
    language: "js",
    filename: "utils.js",
    code: `function calculateTotal(items) {
- let total = 0;
+ let subtotal = 0;

  for (const item of items) {
-   total += item.price * item.quantity;
+   subtotal += item.price * item.quantity;
  }

- return total;
+ return subtotal;
}`,
  },
]

const Example = () => <CodeBlockShowcase files={code} lineNumbers />

export default Example
