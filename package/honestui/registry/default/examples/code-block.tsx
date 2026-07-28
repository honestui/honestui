"use client"

import { CodeBlockShowcase, type CodeSample } from "./code-block-shared"

const code: CodeSample[] = [
  {
    language: "js",
    filename: "MyComponent.jsx",
    code: `function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}`,
  },
  {
    language: "tsx",
    filename: "MyComponent.tsx",
    code: `function MyComponent(props: { name: string }) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}`,
  },
]

const Example = () => <CodeBlockShowcase files={code} />

export default Example
