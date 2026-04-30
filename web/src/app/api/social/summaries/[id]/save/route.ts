import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { SavedSummary } from "@/server/models/SavedSummary";
import { createNotificationEvent, unreadCount } from "@/server/notifications/store";
import { ssePublish } from "@/server/notifications/sseHub";
import { getPublicSummaryAccess } from "@/server/social/utils";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export function POST(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      const { id } = await ctx.params;
      await emitAuditEventV1(request, {
        eventType: "social.save.added",
        actorUserId: "unknown",
        targetType: "social_summary",
        targetId: id,
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const access = await getPublicSummaryAccess(id);
    if (!access.ok) {
      await emitAuditEventV1(request, {
        eventType: "social.save.added",
        actorUserId: userId,
        targetType: "social_summary",
        targetId: id,
        result: access.httpStatus === 403 ? "denied" : "not_found",
      });
      return NextResponse.json(
        { error: access.httpStatus === 403 ? "Forbidden" : "Not found" },
        { status: access.httpStatus },
      );
    }
    const pub = access.doc;

    try {
      await SavedSummary.create({ userId, summaryId: id });
    } catch (e: unknown) {
      if ((e as { code?: number })?.code === 11000) {
        await emitAuditEventV1(request, {
          eventType: "social.save.added",
          actorUserId: userId,
          targetType: "social_summary",
          targetId: id,
          result: "ok",
          metadata: { alreadySaved: true },
        });
        return NextResponse.json({ saved: true });
      }
      await emitAuditEventV1(request, {
        eventType: "social.save.added",
        actorUserId: userId,
        targetType: "social_summary",
        targetId: id,
        result: "error",
        metadata: { error: (e as Error)?.message || String(e) },
      });
      throw e;
    }

    const ownerId = pub.userId.toString();
    if (ownerId !== userId) {
      await createNotificationEvent({
        ownerId,
        actorId: userId,
        summaryId: id,
        eventType: "save",
      });
      const unread = await unreadCount(ownerId);
      ssePublish(ownerId, { unread, refresh: true });
    }

    await emitAuditEventV1(request, {
      eventType: "social.save.added",
      actorUserId: userId,
      targetType: "social_summary",
      targetId: id,
      result: "ok",
    });
    return NextResponse.json({ saved: true }, { status: 201 });
  });
}

export function DELETE(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      const { id } = await ctx.params;
      await emitAuditEventV1(request, {
        eventType: "social.save.removed",
        actorUserId: "unknown",
        targetType: "social_summary",
        targetId: id,
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const access = await getPublicSummaryAccess(id);
    if (!access.ok) {
      await emitAuditEventV1(request, {
        eventType: "social.save.removed",
        actorUserId: userId,
        targetType: "social_summary",
        targetId: id,
        result: access.httpStatus === 403 ? "denied" : "not_found",
      });
      return NextResponse.json(
        { error: access.httpStatus === 403 ? "Forbidden" : "Not found" },
        { status: access.httpStatus },
      );
    }

    const deleted = await SavedSummary.deleteOne({ summaryId: id, userId });
    await emitAuditEventV1(request, {
      eventType: "social.save.removed",
      actorUserId: userId,
      targetType: "social_summary",
      targetId: id,
      result: deleted.deletedCount === 1 ? "ok" : "not_found",
    });
    return NextResponse.json({ saved: false });
  });
}
