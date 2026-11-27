// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
/** Application session tokens are minted on your backend and refreshed on expiry. */

export const FRONTEND_TOKEN_HEADER = "x-honestai-session-token";

export interface MintFrontendTokenResponse {
  token: string;
  expires_at: number; // unix seconds
}

export interface FrontendTokenManagerOptions {
  /** Your backend mint endpoint, e.g. "/api/frontend-token". */
  mintUrl: string;
  /** Override for tests / SSR. Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
  /** Refresh this many seconds before expiry. Default 60. */
  refreshSkewSeconds?: number;
}

export interface FrontendTokenManager {
  /** A token valid for at least refreshSkewSeconds (single-flight mint). */
  getToken(): Promise<string>;
  /** Drop the cached token. Pass the token that 401'd so a concurrent refresh
   *  is not discarded. */
  invalidate(staleToken?: string): void;
}

export function createFrontendTokenManager({
  mintUrl,
  fetch: customFetch,
  refreshSkewSeconds = 60,
}: FrontendTokenManagerOptions): FrontendTokenManager {
  const fetchImpl = customFetch ?? globalThis.fetch.bind(globalThis);

  let token: string | null = null;
  let expiresAt = 0; // unix seconds
  let inflight: Promise<string> | null = null;

  const mint = async (): Promise<string> => {
    const res = await fetchImpl(mintUrl, { method: "POST" });
    if (!res.ok) {
      throw new Error(`frontend-token mint failed: ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as MintFrontendTokenResponse;
    if (typeof body.token !== "string" || !body.token || !Number.isFinite(body.expires_at) || body.expires_at <= Date.now() / 1000)
      throw new Error("Session token response must contain a token and future expires_at");
    token = body.token;
    expiresAt = body.expires_at;
    return body.token;
  };

  return {
    async getToken(): Promise<string> {
      const nowSeconds = Date.now() / 1000;
      if (token !== null && nowSeconds < expiresAt - refreshSkewSeconds) return token;
      // Single-flight: callers during a refresh await the same mint.
      if (inflight === null) {
        inflight = mint().finally(() => {
          inflight = null;
        });
      }
      return inflight;
    },

    invalidate(staleToken?: string): void {
      if (staleToken === undefined || staleToken === token) {
        token = null;
        expiresAt = 0;
      }
    },
  };
}

/**
 * Wrap a base fetch so every request carries a fresh token, with one reactive
 * retry on 401. The request is re-sent with the same init — pass re-readable
 * (string) bodies only.
 */
export function createSessionFetch(
  tokens: FrontendTokenManager,
  baseFetch?: typeof fetch,
): typeof fetch {
  const fetchImpl = baseFetch ?? globalThis.fetch.bind(globalThis);

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const token = await tokens.getToken();
    const headers = new Headers(init?.headers);
    headers.set(FRONTEND_TOKEN_HEADER, token);

    let res = await fetchImpl(input, { ...init, headers });

    if (res.status === 401) {
      tokens.invalidate(token);
      const freshToken = await tokens.getToken();
      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set(FRONTEND_TOKEN_HEADER, freshToken);
      res = await fetchImpl(input, { ...init, headers: retryHeaders });
    }

    return res;
  };
}
