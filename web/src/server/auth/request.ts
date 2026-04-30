import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { User } from "../models/User";
import { armorIqEmitAuditEvent } from "../security/armoriq";
import type { AuditEventV1 } from "../security/types";

export const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";

export function getBearerToken(request: NextRequest): string | undefined {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice("bearer ".length).trim();
  }
  return undefined;
}

export function getUserIdFromRequest(request: NextRequest): string | undefined {
  const bearer = getBearerToken(request);
  const cookieToken = request.cookies.get("auth_token")?.value;
  const token = bearer || cookieToken;
  if (!token) return undefined;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return payload.sub;
  } catch {
    // Emit audit on failed token verification (observe mode should be non-blocking).
    try {
      const decoded = jwt.decode(token) as { sub?: unknown } | null;
      const decodedSub = decoded?.sub;
      const actorUserId =
        typeof decodedSub === "string" && decodedSub.trim().length ? decodedSub : "unknown";

      const event: AuditEventV1 = {
        eventType: "auth.token.invalid",
        actorUserId,
        targetType: "auth",
        targetId: "token",
        result: "invalid",
        timestamp: new Date().toISOString(),
        request: getRequestContext(request),
      };

      void armorIqEmitAuditEvent(event, { userId: actorUserId }).catch(() => {
        // ignore audit failures
      });
    } catch {
      // ignore decode/audit failures
    }
    return undefined;
  }
}

export function getClientIp(request: NextRequest): string | undefined {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return undefined;
}

export function getRequestContext(request: NextRequest): {
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
} {
  return {
    method: request.method,
    path: request.nextUrl.pathname,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent")?.slice(0, 512),
  };
}

export async function getUserEmailFromRequest(request: NextRequest): Promise<string | undefined> {
  const userId = getUserIdFromRequest(request);
  if (!userId) return undefined;

  const user = await User.findById(userId).select("email").lean();
  const email = (user as { email?: unknown } | null)?.email;
  return typeof email === "string" && email.trim().length ? email : undefined;
}
