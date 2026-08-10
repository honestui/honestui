declare module "@dotenvx/dotenvx" {
  export function config(options?: {
    path?: string
    overload?: boolean
    quiet?: boolean
  }): unknown
}

declare module "@babel/core" {
  export function transformFromAstSync(
    ast: unknown,
    code: string,
    options?: Record<string, unknown>
  ): { code?: string | null; ast?: unknown } | null
}

declare module "stringify-object" {
  export default function objectToString(value: unknown): string
}
