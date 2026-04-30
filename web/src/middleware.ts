import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { corsPreflightResponse } from "@/lib/api/cors";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api") && request.method === "OPTIONS") {
    return corsPreflightResponse(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
