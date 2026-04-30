import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:3000";

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  const allowed = new Set([CLIENT_BASE_URL, "http://localhost:3000"]);
  if (allowed.has(origin)) return true;
  if (origin.startsWith("chrome-extension://")) return true;
  return false;
}

/** Origin to echo in Access-Control-Allow-Origin, or null if none / not allowed */
export function corsAllowOrigin(origin: string | null): string | null {
  if (!origin) return null;
  return isAllowedOrigin(origin) ? origin : null;
}

export function corsHeadersForRequest(request: NextRequest): Headers {
  const origin = request.headers.get("origin");
  const h = new Headers();
  h.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  h.set("Access-Control-Allow-Credentials", "true");
  const allow = corsAllowOrigin(origin);
  if (allow) {
    h.set("Access-Control-Allow-Origin", allow);
  }
  return h;
}

export function mergeCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const extra = corsHeadersForRequest(request);
  extra.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}

export function corsPreflightResponse(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeadersForRequest(request) });
}
