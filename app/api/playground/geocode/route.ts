/**
 * Finds a place's coordinates for the playground's maps, so a model never
 * writes coordinates itself. Lookups go to OpenStreetMap's Nominatim under
 * its usage policy (https://operations.osmfoundation.org/policies/nominatim/):
 * at most one request per second for the whole site, an identifying
 * User-Agent, cached results, and a way to switch the service off without a
 * code change (PLAYGROUND_GEOCODER=off).
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  "HonestAI-Playground/0.1 (+https://ai.honestui.com/docs/ai/generative/playground)";

const MAX_QUERY_CHARACTERS = 200;
const MAX_REQUEST_BYTES = 2_000;
const LOOKUP_TIMEOUT_MS = 10_000;
// A queue longer than this is better answered with "try again" than a long wait.
const MAX_QUEUE_WAIT_MS = 8_000;
const NOMINATIM_INTERVAL_MS = 1_000;
const REQUESTS_PER_WINDOW = 30;
const WINDOW_MILLISECONDS = 60_000;
const CACHE_LIMIT = 1_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

export type GeocodedPlace = { lat: number; lon: number; label: string };

/**
 * Lookups by normalized query, found or not. This lives in one server
 * instance's memory; each instance also keeps its own one-per-second queue,
 * so several instances together can exceed the policy's rate. Keep the
 * playground on few instances, or switch lookups off, if traffic grows.
 */
const cache = new Map<string, { place: GeocodedPlace | null; storedAt: number }>();
const recentRequests = new Map<string, number[]>();
let nextNominatimSlot = 0;

function refuse(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function isRateLimited(client: string, now: number) {
  const recent = (recentRequests.get(client) ?? []).filter(
    (time) => now - time < WINDOW_MILLISECONDS,
  );
  const limited = recent.length >= REQUESTS_PER_WINDOW;
  recentRequests.set(client, limited ? recent : [...recent, now]);
  // Forget clients whose window has passed, so the map cannot grow forever.
  if (recentRequests.size > 5_000) {
    for (const [key, times] of recentRequests) {
      if (times.every((time) => now - time >= WINDOW_MILLISECONDS)) recentRequests.delete(key);
    }
  }
  return limited;
}

function remember(key: string, place: GeocodedPlace | null) {
  // Map keeps insertion order, so the first key is the oldest entry.
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, { place, storedAt: Date.now() });
}

/** Reserves the next one-per-second slot, or returns null when the wait is too long. */
function reserveSlot(now: number) {
  const slot = Math.max(now, nextNominatimSlot);
  if (slot - now > MAX_QUEUE_WAIT_MS) return null;
  nextNominatimSlot = slot + NOMINATIM_INTERVAL_MS;
  return slot - now;
}

/** The first result, or null; anything malformed counts as not found. */
function readPlace(body: unknown): GeocodedPlace | null {
  const first = Array.isArray(body) ? (body[0] as Record<string, unknown> | undefined) : undefined;
  if (!first) return null;
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  const label = typeof first.display_name === "string" ? first.display_name : "";
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return null;
  return { lat, lon, label };
}

/**
 * The searches to try, in order. Nominatim's free-text search finds nothing
 * when a query carries an extra part such as an institution ("Thompson
 * Library, Ohio State University, Columbus, Ohio, USA"), so a long query is
 * retried once without its second part. A looser search can match the wrong
 * place; the map shows what each search matched so the reader can tell.
 */
function searchesFor(query: string): string[] {
  const parts = query.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length >= 4 ? [query, [parts[0], ...parts.slice(2)].join(", ")] : [query];
}

/** One Nominatim search, in its one-per-second slot: the best match, null, or a refusal to return. */
async function searchNominatim(
  query: string,
  request: Request,
  language: string | undefined,
): Promise<GeocodedPlace | null | Response> {
  const wait = reserveSlot(Date.now());
  if (wait === null) return refuse(503, "Place lookups are busy. Try again in a few seconds.");
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  if (request.signal.aborted) return new Response(null, { status: 499 });

  const url = new URL(NOMINATIM_URL);
  url.search = new URLSearchParams({ q: query, format: "jsonv2", limit: "1" }).toString();
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        ...(language ? { "Accept-Language": language } : {}),
      },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(LOOKUP_TIMEOUT_MS)]),
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error("Geocode: Nominatim could not be reached", error instanceof Error ? error.name : "Unknown error");
    return refuse(502, "OpenStreetMap's place search could not be reached. Try again in a moment.");
  }
  if (!upstream.ok) {
    void upstream.body?.cancel().catch(() => {});
    // Log only the status; the body is the provider's.
    console.error(`Geocode: Nominatim answered ${upstream.status}`);
    return upstream.status === 429 || upstream.status === 403
      ? refuse(503, "OpenStreetMap's place search is limiting requests. Try again later.")
      : refuse(502, "OpenStreetMap's place search returned an error. Try again in a moment.");
  }
  return readPlace(await upstream.json().catch(() => null));
}

async function readQuery(request: Request): Promise<string | null> {
  const length = Number(request.headers.get("content-length"));
  if (length > MAX_REQUEST_BYTES) return null;
  const text = await request.text().catch(() => "");
  if (text.length > MAX_REQUEST_BYTES) return null;
  try {
    const query = (JSON.parse(text) as { query?: unknown }).query;
    if (typeof query !== "string") return null;
    const trimmed = query.trim().replace(/\s+/g, " ");
    return trimmed.length >= 2 && trimmed.length <= MAX_QUERY_CHARACTERS ? trimmed : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (process.env.PLAYGROUND_GEOCODER === "off") {
    return refuse(503, "Place lookup is turned off on this site.");
  }

  // A browser on another site sends its own Origin. Scripts can omit it, which
  // is why the limits below do not depend on this check.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) {
        return refuse(403, "This endpoint only serves the playground page.");
      }
    } catch {
      return refuse(403, "This endpoint only serves the playground page.");
    }
  }

  const client = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();
  if (isRateLimited(client, now)) {
    return refuse(429, "Too many place lookups. Wait a minute, then try again.");
  }

  const query = await readQuery(request);
  if (!query) return refuse(400, "Send a place name between 2 and 200 characters.");

  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached && now - cached.storedAt < CACHE_TTL_MS) {
    return Response.json({ place: cached.place }, { headers: { "Cache-Control": "no-store" } });
  }

  const language = request.headers.get("accept-language")?.split(",")[0]?.trim();
  let place: GeocodedPlace | null = null;
  for (const candidate of searchesFor(query)) {
    const found = await searchNominatim(candidate, request, language);
    if (found instanceof Response) return found;
    place = found;
    if (place) break;
  }
  remember(key, place);
  return Response.json({ place }, { headers: { "Cache-Control": "no-store" } });
}
