"use client"

import { CodeBlockShowcase, type CodeSample } from "./code-block-shared"

const code: CodeSample[] = [
  {
    language: "tsx",
    filename: "format-user.tsx",
    code: `type User = { firstName: string; lastName: string };

export function formatUser(user: User) {
  return \`\${user.firstName} \${user.lastName}\`;
}`,
  },
  {
    language: "ts",
    filename: "format-user.ts",
    code: `type User = { firstName: string; lastName: string };

export function formatUser(user: User) {
  return [user.firstName, user.lastName].join(" ");
}`,
  },
]

const Example = () => <CodeBlockShowcase files={code} lineNumbers />

export default Example
