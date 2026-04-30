import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import {
  authCookieOptions,
  CLIENT_BASE_URL,
  createAppToken,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  SERVER_BASE_URL,
  upsertUserFromGoogleIdToken,
} from "@/server/auth/googleOAuth";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

const EXTENSION_SUCCESS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login Successful - Notionix</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FCFCFD; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #1E293B; }
    .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #F1F5F9; text-align: center; max-width: 400px; }
    .icon { width: 48px; height: 48px; background: #EEF2FF; color: #4B5CC4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    h1 { margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #0F172A; }
    p { margin: 0; color: #64748B; line-height: 1.5; font-size: 15px; }
  </style>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'NOTIONIX_AUTH_SUCCESS' }, '*');
    }
    setTimeout(function() { window.close(); }, 3000);
  </script>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    </div>
    <h1>Authentication Successful</h1>
    <p>You have successfully securely connected your account. You can safely close this window.</p>
  </div>
</body>
</html>`;

export function GET(request: NextRequest) {
  return withDb(request, async () => {
    const code = request.nextUrl.searchParams.get("code") || undefined;
    const target = request.nextUrl.searchParams.get("state") || "web";

    if (!code) {
      await emitAuditEventV1(request, {
        eventType: "auth.login.failed",
        actorUserId: "unknown",
        targetType: "auth",
        targetId: "google_oauth_callback",
        result: "invalid",
      });
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    const redirectUri = `${SERVER_BASE_URL}/api/auth/google/callback`;

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
          targetId: "google_oauth_callback",
          result: "error",
          metadata: { details },
        });
        return new NextResponse(`Failed to obtain id_token from Google. ${details}`, { status: 500 });
      }

      const user = await upsertUserFromGoogleIdToken(tokenJson.id_token);
      await emitAuditEventV1(request, {
        eventType: "auth.login.success",
        actorUserId: user.id,
        targetType: "auth",
        targetId: "google_oauth_callback",
        result: "ok",
      });
      const appToken = createAppToken(user.id);

      if (target === "extension") {
        const res = new NextResponse(EXTENSION_SUCCESS_HTML, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
        res.cookies.set("auth_token", appToken, authCookieOptions());
        return res;
      }

      const res = NextResponse.redirect(`${CLIENT_BASE_URL}/dashboard`);
      res.cookies.set("auth_token", appToken, authCookieOptions());
      return res;
    } catch (err) {
      console.error(err);
      await emitAuditEventV1(request, {
        eventType: "auth.login.failed",
        actorUserId: "unknown",
        targetType: "auth",
        targetId: "google_oauth_callback",
        result: "error",
      });
      return new NextResponse("Google OAuth error", { status: 500 });
    }
  });
}
