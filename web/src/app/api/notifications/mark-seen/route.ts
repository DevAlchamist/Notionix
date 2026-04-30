import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { markAllNotificationsSeen, unreadCount } from "@/server/notifications/store";
import { ssePublish } from "@/server/notifications/sseHub";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      await emitAuditEventV1(request, {
        eventType: "notification.mark_seen",
        actorUserId: "unknown",
        targetType: "notification",
        targetId: "inbox",
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      await markAllNotificationsSeen(userId);
    } catch (err) {
      await emitAuditEventV1(request, {
        eventType: "notification.mark_seen",
        actorUserId: userId,
        targetType: "notification",
        targetId: "inbox",
        result: "error",
        metadata: { error: (err as Error)?.message ?? String(err) },
      });
      throw err;
    }

    const unread = await unreadCount(userId);
    await emitAuditEventV1(request, {
      eventType: "notification.mark_seen",
      actorUserId: userId,
      targetType: "notification",
      targetId: "inbox",
      result: "ok",
      metadata: { unread },
    });
    ssePublish(userId, { unread, refresh: true });
    return NextResponse.json({ ok: true, unread });
  });
}
