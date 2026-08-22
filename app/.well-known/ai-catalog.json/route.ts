import { AI_CATALOG_MEDIA_TYPE, getMcpAiCatalog } from "@/lib/mcp-discovery";

export function GET() {
  return new Response(JSON.stringify(getMcpAiCatalog()), {
    status: 200,
    headers: {
      "content-type": `${AI_CATALOG_MEDIA_TYPE}; charset=utf-8`,
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
    },
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Content-Type",
    },
  });
}
