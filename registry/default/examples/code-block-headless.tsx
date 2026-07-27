"use client"

import { CodeBlockShowcase, type CodeSample } from "./code-block-shared"

const code: CodeSample[] = [
  {
    language: "tsx",
    filename: "api-client.ts",
    code: `export async function getUser(id: string) {
  const response = await fetch(\`/api/users/\${id}\`);
  if (!response.ok) throw new Error("Failed to load user");
  return response.json();
}`,
  },
]

const Example = () => <CodeBlockShowcase files={code} hideHeader />

export default Example
