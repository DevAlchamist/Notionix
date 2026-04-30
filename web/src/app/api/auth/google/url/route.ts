import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { mergeCorsHeaders } from "@/lib/api/cors";
import { createExtensionState, GOOGLE_CLIENT_ID } from "@/server/auth/googleOAuth";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const redirectUri = request.nextUrl.searchParams.get("redirect_uri") || "";

  if (!GOOGLE_CLIENT_ID) {
    return mergeCorsHeaders(
      NextResponse.json(
        { error: "Missing GOOGLE_CLIENT_ID. Set GOOGLE_CLIENT_ID in environment and restart." },
        { status: 500 },
      ),
      request,
    );
  }

  if (!redirectUri) {
    return mergeCorsHeaders(NextResponse.json({ error: "Missing redirect_uri" }, { status: 400 }), request);
  }

  const state = createExtensionState(redirectUri);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return mergeCorsHeaders(NextResponse.json({ url }), request);
}
