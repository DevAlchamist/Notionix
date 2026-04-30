import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { withDb } from "@/lib/api/withDb";
import { JWT_SECRET } from "@/server/auth/request";
import { User } from "@/server/models/User";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return withDb(request, async () => {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No auth token cookie found" }, { status: 401 });
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
      const user = await User.findById(payload.sub).lean();
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
      return NextResponse.json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      });
    } catch {
      const decoded = jwt.decode(token) as { sub?: unknown } | null;
      const actorUserId =
        typeof decoded?.sub === "string" && decoded.sub.trim().length ? decoded.sub : "unknown";

      await emitAuditEventV1(request, {
        eventType: "auth.token.invalid",
        actorUserId,
        targetType: "auth",
        targetId: "token",
        result: "invalid",
      });
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  });
}
