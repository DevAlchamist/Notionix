import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { SummaryComment } from "@/server/models/SummaryComment";
import { getPublicSummaryAccess } from "@/server/social/utils";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

export function DELETE(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      const { id: summaryId, commentId } = await ctx.params;
      await emitAuditEventV1(request, {
        eventType: "social.comment.removed",
        actorUserId: "unknown",
        targetType: "social_comment",
        targetId: commentId,
        result: "denied",
        metadata: { summaryId },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: summaryId, commentId } = await ctx.params;
    const access = await getPublicSummaryAccess(summaryId);
    if (!access.ok) {
      await emitAuditEventV1(request, {
        eventType: "social.comment.removed",
        actorUserId: userId,
        targetType: "social_comment",
        targetId: commentId,
        result: access.httpStatus === 403 ? "denied" : "not_found",
        metadata: { summaryId },
      });
      return NextResponse.json(
        { error: access.httpStatus === 403 ? "Forbidden" : "Not found" },
        { status: access.httpStatus },
      );
    }
    const pub = access.doc;

    if (!mongoose.isValidObjectId(commentId)) {
      await emitAuditEventV1(request, {
        eventType: "social.comment.removed",
        actorUserId: userId,
        targetType: "social_comment",
        targetId: commentId,
        result: "not_found",
        metadata: { summaryId },
      });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const comment = await SummaryComment.findOne({ _id: commentId, summaryId }).lean();
    if (!comment) {
      await emitAuditEventV1(request, {
        eventType: "social.comment.removed",
        actorUserId: userId,
        targetType: "social_comment",
        targetId: commentId,
        result: "not_found",
        metadata: { summaryId },
      });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAuthor = comment.userId.toString() === userId;
    const isSummaryOwner = pub.userId.toString() === userId;
    if (!isAuthor && !isSummaryOwner) {
      await emitAuditEventV1(request, {
        eventType: "social.comment.removed",
        actorUserId: userId,
        targetType: "social_comment",
        targetId: commentId,
        result: "denied",
        metadata: { summaryId },
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleted = await SummaryComment.deleteOne({ _id: commentId, summaryId });
    await emitAuditEventV1(request, {
      eventType: "social.comment.removed",
      actorUserId: userId,
      targetType: "social_comment",
      targetId: commentId,
      result: deleted.deletedCount === 1 ? "ok" : "not_found",
      metadata: { summaryId },
    });
    return new NextResponse(null, { status: 204 });
  });
}
