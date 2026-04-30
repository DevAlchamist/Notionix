import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { mergeCorsHeaders } from "@/lib/api/cors";
import { GOOGLE_CLIENT_ID, SERVER_BASE_URL } from "@/server/auth/googleOAuth";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target") || "web";
  const redirectUri = `${SERVER_BASE_URL}/api/auth/google/callback`;

  if (!GOOGLE_CLIENT_ID) {
    return mergeCorsHeaders(
      NextResponse.json(
        { error: "Missing GOOGLE_CLIENT_ID. Set GOOGLE_CLIENT_ID in environment and restart." },
        { status: 500 },
      ),
      request,
    );
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state: target,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return mergeCorsHeaders(NextResponse.redirect(url), request);
}
