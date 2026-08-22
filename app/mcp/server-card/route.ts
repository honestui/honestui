import {
  SERVER_CARD_MEDIA_TYPE,
  getMcpServerCard,
} from "@/lib/mcp-discovery";

// ETag for the static card body; recomputed per process, which is fine for
// cache validation because the document only changes when the code does.
function etagFor(body: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < body.length; index += 1) {
    hash ^= body.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `"${hash.toString(16)}"`;
}

const cardBody = JSON.stringify(getMcpServerCard());
const cardEtag = etagFor(cardBody);

const cardHeaders = {
  "cache-control": "public, max-age=3600",
  "etag": cardEtag,
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET",
  "access-control-allow-headers": "Content-Type, If-None-Match",
  "access-control-expose-headers": "ETag",
  "x-content-type-options": "nosniff",
};

export function GET(request: Request) {
  if (request.headers.get("if-none-match") === cardEtag) {
    return new Response(null, { status: 304, headers: cardHeaders });
  }

  return new Response(cardBody, {
    status: 200,
    headers: {
      ...cardHeaders,
      "content-type": `${SERVER_CARD_MEDIA_TYPE}; charset=utf-8`,
    },
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: cardHeaders,
  });
}
