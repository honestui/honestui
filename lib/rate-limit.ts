// Fixed-window fair-use limiter for the public REST API.
//
// State lives in module memory, so on multi-instance hosts the window is
// enforced per serving instance. That only ever makes the effective limit
// looser than the published ceiling, never tighter.

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 600;

// Test processes can lower the ceiling to exercise 429 behavior cheaply.
const LIMIT = Number(process.env.HONESTUI_RATE_LIMIT) || DEFAULT_LIMIT;

export const RATE_LIMIT_POLICY = `${LIMIT};w=60`;
export const RATE_LIMIT_MAX = LIMIT;

type Window = {
  count: number;
  resetAtSeconds: number;
};

const windows = new Map<string, Window>();

function getClientKey(request: Request) {
  // Hosting platforms replace a client-supplied x-forwarded-for with the real
  // client IP; reading it first keeps the key correct on Vercel while letting
  // local tests isolate their buckets.
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export type RateLimitDecision = {
  limit: string;
  remaining: string;
  reset: string;
  policy: string;
  allowed: boolean;
  retryAfter: number;
};

export function checkRateLimit(request: Request): RateLimitDecision {
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (windows.size > 10_000) {
    for (const [key, entry] of windows) {
      if (entry.resetAtSeconds <= nowSeconds) windows.delete(key);
    }
  }

  const key = getClientKey(request);
  const current = windows.get(key);

  if (!current || current.resetAtSeconds <= nowSeconds) {
    const resetAtSeconds = nowSeconds + WINDOW_MS / 1000;
    windows.set(key, { count: 1, resetAtSeconds });

    return {
      limit: String(LIMIT),
      remaining: String(LIMIT - 1),
      reset: String(resetAtSeconds),
      policy: RATE_LIMIT_POLICY,
      allowed: true,
      retryAfter: 0,
    };
  }

  current.count += 1;

  return {
    limit: String(LIMIT),
    remaining: String(Math.max(LIMIT - current.count, 0)),
    reset: String(current.resetAtSeconds),
    policy: RATE_LIMIT_POLICY,
    allowed: current.count <= LIMIT,
    retryAfter: Math.max(current.resetAtSeconds - nowSeconds, 1),
  };
}
