// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
"use client";

import { useMemo } from "react";
import type { ChatStorage } from "../adapters/types";

import { artifactStorageAdapter } from "./artifactStorage";
import {
  createSessionFetch,
  createFrontendTokenManager,
  type FrontendTokenManager,
} from "./frontendTokenManager";
import { threadStorageAdapter } from "./threadStorage";

/** Which storage surfaces useHonestAIStorage wires. */
export interface HonestAIStorageFeatures {
  /** Stored-artifact reads + edits. Default true. */
  artifact?: boolean;
}

export interface HonestAIStorageOptions {
  /** Required URL of your application storage API, implementing the /v1 routes. */
  apiBaseUrl: string;
  /**
   * Where the short-lived session token comes from — either a URL of your
   * backend mint endpoint (POST → { token, expires_at }, cached + refreshed
   * here) or a function returning a fresh token (you own caching). The token
   * rides the `x-honestai-session-token` header on every /v1 call. The frontend
   * token is minted server-side; the master key never reaches the browser.
   */
  token: string | (() => Promise<string>);
  /** Which storage surfaces to wire. Omit to enable all. */
  features?: HonestAIStorageFeatures;
  /** fetch override (tests / SSR). Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
  /** Refresh the cached token this many seconds before expiry (URL form). Default 60. */
  refreshSkewSeconds?: number;
}

/** Memoized adapters for your application's thread and artifact API.
 * Remount ChatProvider when changing identity or storage configuration. */
export function useHonestAIStorage(options: HonestAIStorageOptions): ChatStorage {
  const { apiBaseUrl, token, fetch, refreshSkewSeconds } = options;
  const artifactOn = options.features?.artifact ?? true;
  return useMemo(
    () =>
      createHonestAIStorage({
        apiBaseUrl,
        token,
        fetch,
        refreshSkewSeconds,
        features: { artifact: artifactOn },
      }),
    [apiBaseUrl, token, fetch, refreshSkewSeconds, artifactOn],
  );
}

/** The actual storage wiring — a pure factory with no React, memoised by the
 *  hook above. */
export function createHonestAIStorage(options: HonestAIStorageOptions): ChatStorage {
  if (!options.apiBaseUrl) throw new Error("Honest AI storage requires an application API URL");
  const tokens = toTokenManager(options);
  const fctFetch = createSessionFetch(tokens, options.fetch);
  const artifactOn = options.features?.artifact ?? true;
  const baseUrl = options.apiBaseUrl;

  const storage: ChatStorage = {
    thread: threadStorageAdapter({ baseUrl, fetch: fctFetch }),
  };
  if (artifactOn) {
    storage.artifact = artifactStorageAdapter({ baseUrl, fetch: fctFetch });
  }
  return storage;
}

/** Normalize the `token` option into a FrontendTokenManager. */
function toTokenManager(options: HonestAIStorageOptions): FrontendTokenManager {
  if (typeof options.token === "string") {
    return createFrontendTokenManager({
      mintUrl: options.token,
      fetch: options.fetch,
      refreshSkewSeconds: options.refreshSkewSeconds,
    });
  }
  const provider = options.token;
  let current: string | null = null;
  return {
    async getToken(): Promise<string> {
      current = await provider();
      return current;
    },
    invalidate(staleToken?: string): void {
      if (staleToken === undefined || staleToken === current) current = null;
    },
  };
}
