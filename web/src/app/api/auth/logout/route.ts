import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { mergeCorsHeaders } from "@/lib/api/cors";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  return withDb(request, async () => {
    const actorUserId = getUserIdFromRequest(request) ?? "unknown";

    const res = new NextResponse(null, { status: 204 });
    res.cookies.set("auth_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });

    await emitAuditEventV1(request, {
      eventType: "auth.logout",
      actorUserId,
      targetType: "auth",
      targetId: "logout",
      result: "ok",
    });

    return mergeCorsHeaders(res, request);
  });
}
