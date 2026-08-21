import { getOpenApiDocument } from "@/lib/openapi";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  return Response.json(getOpenApiDocument(), {
    headers: { "x-content-type-options": "nosniff" },
  });
}
