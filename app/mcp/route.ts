import { originValidationResponse } from "@modelcontextprotocol/server";

import { honestUiMcpHandler } from "@/lib/mcp-server";

const allowedOriginHostnames = [
  "honestui.com",
  "www.honestui.com",
  "localhost",
  "127.0.0.1",
  "[::1]",
];

const protocolHeaders = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

function withProtocolHeaders(response: Response) {
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(protocolHeaders)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function methodNotAllowed() {
  return Response.json(
    {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32600,
        message: "Method not allowed. Send MCP JSON-RPC requests with POST.",
      },
    },
    {
      status: 405,
      headers: {
        ...protocolHeaders,
        allow: "POST, OPTIONS",
      },
    },
  );
}

export async function POST(request: Request) {
  const rejected = originValidationResponse(request, allowedOriginHostnames);
  if (rejected) return withProtocolHeaders(rejected);

  return withProtocolHeaders(await honestUiMcpHandler.fetch(request));
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...protocolHeaders,
      allow: "POST, OPTIONS",
    },
  });
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const PUT = methodNotAllowed;
