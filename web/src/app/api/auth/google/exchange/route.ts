import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import {
  createAppToken,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  upsertUserFromGoogleIdToken,
  verifyExtensionState,
} from "@/server/auth/googleOAuth";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  return withDb(request, async () => {
    let body: { code?: string; redirect_uri?: string; state?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { code, redirect_uri: redirectUri, state } = body;
    if (!code || !redirectUri || !state) {
      await emitAuditEventV1(request, {
        eventType: "auth.login.failed",
        actorUserId: "unknown",
        targetType: "auth",
        targetId: "google_oauth_exchange",
        result: "invalid",
      });
      return NextResponse.json({ error: "Missing code, redirect_uri, or state" }, { status: 400 });
    }

    try {
      verifyExtensionState(state, redirectUri);
    } catch {
      await emitAuditEventV1(request, {
        eventType: "auth.login.failed",
        actorUserId: "unknown",
        targetType: "auth",
        targetId: "google_oauth_exchange",
        result: "invalid",
        metadata: { redirectUri },
      });
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenJson = (await tokenRes.json()) as {
        id_token?: string;
        access_token?: string;
        error?: string;
        error_description?: string;
      };

      if (!tokenRes.ok || !tokenJson.id_token) {
        const details =
          tokenJson.error || tokenJson.error_description
            ? `Google token error: ${tokenJson.error || ""} ${tokenJson.error_description || ""}`.trim()
            : `Google token error: HTTP ${tokenRes.status}`;
        console.error(details, {
          hasClientId: !!GOOGLE_CLIENT_ID,
          hasClientSecret: !!GOOGLE_CLIENT_SECRET,
          redirectUri,
        });
        await emitAuditEventV1(request, {
          eventType: "auth.login.failed",
          actorUserId: "unknown",
          targetType: "auth",
          targetId: "google_oauth_exchange",
          result: "error",
          metadata: { details },
        });
        return NextResponse.json(
          { error: `Failed to obtain id_token from Google. ${details}` },
          { status: 500 },
        );
      }

      const user = await upsertUserFromGoogleIdToken(tokenJson.id_token);
      await emitAuditEventV1(request, {
        eventType: "auth.login.success",
        actorUserId: user.id,
        targetType: "auth",
        targetId: "google_oauth_exchange",
        result: "ok",
      });
      const appToken = createAppToken(user.id);

      return NextResponse.json({
        token: appToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      });
    } catch (err) {
      console.error(err);
      await emitAuditEventV1(request, {
        eventType: "auth.login.failed",
        actorUserId: "unknown",
        targetType: "auth",
        targetId: "google_oauth_exchange",
        result: "error",
      });
      return NextResponse.json({ error: "Google OAuth exchange error" }, { status: 500 });
    }
  });
}
