import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { SummaryComment, SUMMARY_COMMENT_MAX_BODY } from "@/server/models/SummaryComment";
import { createNotificationEvent, unreadCount } from "@/server/notifications/store";
import { ssePublish } from "@/server/notifications/sseHub";
import { authorFromPopulated, getPublicSummaryAccess } from "@/server/social/utils";
import { emitAuditEventV1 } from "@/server/security/audit";
import { maybeRunRiskContentHook } from "@/server/security/risk";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export function GET(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const access = await getPublicSummaryAccess(id);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.httpStatus === 403 ? "Forbidden" : "Not found" },
        { status: access.httpStatus },
      );
    }

    const limit = Math.min(
      Math.max(parseInt(String(request.nextUrl.searchParams.get("limit") || "30"), 10) || 30, 1),
      100,
    );
    const skip = Math.max(parseInt(String(request.nextUrl.searchParams.get("skip") || "0"), 10) || 0, 0);

    const comments = await SummaryComment.find({ summaryId: id })
      .populate("userId", "name avatar")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      items: comments.map((c) => ({
        id: c._id.toString(),
        body: c.body,
        createdAt: c.createdAt,
        author: authorFromPopulated(c.userId),
        userId: (c.userId as { _id?: mongoose.Types.ObjectId })?._id?.toString() ?? "",
      })),
      hasMore: comments.length === limit,
    });
  });
}

export function POST(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      await emitAuditEventV1(request, {
        eventType: "social.comment.added",
        actorUserId: "unknown",
        targetType: "social_comment",
        result: "denied",
        metadata: { summaryId: (await ctx.params).id },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const access = await getPublicSummaryAccess(id);
    if (!access.ok) {
      await emitAuditEventV1(request, {
        eventType: "social.comment.added",
        actorUserId: userId,
        targetType: "social_comment",
        result: access.httpStatus === 403 ? "denied" : "not_found",
        metadata: { summaryId: id },
      });
      return NextResponse.json(
        { error: access.httpStatus === 403 ? "Forbidden" : "Not found" },
        { status: access.httpStatus },
      );
    }
    const pub = access.doc;

    const bodyJson = (await request.json()) as { body?: unknown };
    const body = String(bodyJson?.body ?? "").trim();
    if (!body) {
      await emitAuditEventV1(request, {
        eventType: "social.comment.added",
        actorUserId: userId,
        targetType: "social_comment",
        result: "invalid",
        metadata: { summaryId: id },
      });
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }
    if (body.length > SUMMARY_COMMENT_MAX_BODY) {
      await emitAuditEventV1(request, {
        eventType: "social.comment.added",
        actorUserId: userId,
        targetType: "social_comment",
        result: "invalid",
        metadata: { summaryId: id, length: body.length, max: SUMMARY_COMMENT_MAX_BODY },
      });
      return NextResponse.json(
        { error: `body must be at most ${SUMMARY_COMMENT_MAX_BODY} characters` },
        { status: 400 },
      );
    }

    await maybeRunRiskContentHook({
      request,
      actorUserId: userId,
      targetType: "social_comment",
      eventType: "risk.decision.comment_create",
      metadata: {
        summaryId: id,
        bodyLength: body.length,
      },
    });

    let doc: unknown;
    try {
      doc = await SummaryComment.create({
        userId,
        summaryId: id,
        body,
      });
    } catch (err) {
      await emitAuditEventV1(request, {
        eventType: "social.comment.added",
        actorUserId: userId,
        targetType: "social_comment",
        result: "error",
        metadata: { summaryId: id, error: (err as Error)?.message ?? String(err) },
      });
      throw err;
    }

    const createdComment = doc as { _id: mongoose.Types.ObjectId };
    const commentId = createdComment._id.toString();

    await emitAuditEventV1(request, {
      eventType: "social.comment.added",
      actorUserId: userId,
      targetType: "social_comment",
      targetId: commentId,
      result: "ok",
      metadata: { summaryId: id },
    });

    const ownerId = pub.userId.toString();
    if (ownerId !== userId) {
      await createNotificationEvent({
        ownerId,
        actorId: userId,
        summaryId: id,
        eventType: "comment",
        commentId,
      });
      const unread = await unreadCount(ownerId);
      ssePublish(ownerId, { unread, refresh: true });
    }

    const populated = await SummaryComment.findById(createdComment._id).populate("userId", "name avatar").lean();
    if (!populated) {
      return NextResponse.json(
        {
          id: createdComment._id.toString(),
          body,
          createdAt: (createdComment as { createdAt?: Date }).createdAt,
          author: authorFromPopulated({ _id: new mongoose.Types.ObjectId(userId) }),
          userId,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        id: populated._id.toString(),
        body: populated.body,
        createdAt: populated.createdAt,
        author: authorFromPopulated(populated.userId),
        userId,
      },
      { status: 201 },
    );
  });
}
