import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import { resolveRegistryUrl } from "@/src/registry/builder"
import {
  RegistryFetchError,
  RegistryError,
  RegistryForbiddenError,
  RegistryGoneError,
  RegistryLocalFileError,
  RegistryNotFoundError,
  RegistryParseError,
  RegistryTimeoutError,
  RegistryUnauthorizedError,
} from "@/src/registry/errors"
import { registryItemSchema } from "@/src/schema"
import { HttpsProxyAgent } from "https-proxy-agent"
import fetch, { Headers } from "node-fetch"
import { z } from "zod"

const DEFAULT_TIMEOUT_MS = 30_000

const agent = process.env.https_proxy
  ? new HttpsProxyAgent(process.env.https_proxy)
  : undefined

const registryCache = new Map<string, Promise<unknown>>()

export interface RegistryFetchOptions {
  headers?: Record<string, string>
  signal?: AbortSignal
  timeoutMs?: number
  useCache?: boolean
}

export function clearRegistryCache() {
  registryCache.clear()
}

function getCacheKey(url: string, headers: Record<string, string>) {
  const normalizedHeaders = Object.entries(headers)
    .map(([key, value]) => [key.toLowerCase(), value] as const)
    .sort(([first], [second]) => first.localeCompare(second))

  const credentialsHash = createHash("sha256")
    .update(JSON.stringify(normalizedHeaders))
    .digest("hex")

  return `${url}::${credentialsHash}`
}

async function fetchRegistryPath(
  url: string,
  options: Required<Pick<RegistryFetchOptions, "timeoutMs">> &
    RegistryFetchOptions
) {
  const controller = new AbortController()
  let timedOut = false

  const handleAbort = () => controller.abort(options.signal?.reason)
  options.signal?.addEventListener("abort", handleAbort, { once: true })

  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, options.timeoutMs)

  const requestHeaders = new Headers({
    Accept: "application/vnd.honestui.v1+json, application/json;q=0.9",
    "User-Agent": "honestui",
  })

  for (const [key, value] of Object.entries(options.headers ?? {})) {
    requestHeaders.set(key, value)
  }

  try {
    const response = await fetch(url, {
      agent,
      headers: requestHeaders,
      signal: controller.signal,
    })

    if (!response.ok) {
      let messageFromServer: string | undefined

      if (response.headers.get("content-type")?.includes("application/json")) {
        const json = await response.json()
        const parsed = z
          .object({
            detail: z.string().optional(),
            title: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional(),
          })
          .safeParse(json)

        if (parsed.success) {
          messageFromServer = parsed.data.detail || parsed.data.message

          if (parsed.data.error) {
            messageFromServer = `[${parsed.data.error}] ${messageFromServer ?? "Registry request failed"}`
          }
        }
      }

      if (response.status === 401) {
        throw new RegistryUnauthorizedError(url, messageFromServer)
      }

      if (response.status === 404) {
        throw new RegistryNotFoundError(url, messageFromServer)
      }

      if (response.status === 410) {
        throw new RegistryGoneError(url, messageFromServer)
      }

      if (response.status === 403) {
        throw new RegistryForbiddenError(url, messageFromServer)
      }

      throw new RegistryFetchError(url, response.status, messageFromServer)
    }

    return response.json()
  } catch (error) {
    if (timedOut) {
      throw new RegistryTimeoutError(url, options.timeoutMs)
    }

    if (error instanceof RegistryError) {
      throw error
    }

    if (options.signal?.aborted) {
      throw error
    }

    throw new RegistryFetchError(url, undefined, undefined, error)
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener("abort", handleAbort)
  }
}

export async function fetchRegistry(
  paths: string[],
  options: RegistryFetchOptions = {}
) {
  const resolvedOptions = {
    timeoutMs: DEFAULT_TIMEOUT_MS,
    useCache: true,
    ...options,
  }

  return Promise.all(
    paths.map((registryPath) => {
      const url = resolveRegistryUrl(registryPath)
      const cacheKey = getCacheKey(url, resolvedOptions.headers ?? {})

      if (resolvedOptions.useCache) {
        const cachedResult = registryCache.get(cacheKey)
        if (cachedResult) {
          return cachedResult
        }
      }

      const fetchPromise = fetchRegistryPath(url, resolvedOptions)

      if (resolvedOptions.useCache) {
        registryCache.set(cacheKey, fetchPromise)
        void fetchPromise.catch(() => {
          if (registryCache.get(cacheKey) === fetchPromise) {
            registryCache.delete(cacheKey)
          }
        })
      }

      return fetchPromise
    })
  )
}

export async function fetchRegistryLocal(filePath: string) {
  try {
    let expandedPath = filePath
    if (filePath.startsWith("~/")) {
      expandedPath = path.join(homedir(), filePath.slice(2))
    }

    const resolvedPath = path.resolve(expandedPath)
    const content = await fs.readFile(resolvedPath, "utf8")
    const parsed = JSON.parse(content)

    try {
      return registryItemSchema.parse(parsed)
    } catch (error) {
      throw new RegistryParseError(filePath, error)
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("ENOENT") ||
        error.message.includes("no such file"))
    ) {
      throw new RegistryLocalFileError(filePath, error)
    }

    if (error instanceof RegistryParseError) {
      throw error
    }

    throw new RegistryLocalFileError(filePath, error)
  }
}
