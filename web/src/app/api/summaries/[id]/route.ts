import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { Summary, type SummaryVisibility } from "@/server/models/Summary";
import "@/server/models/Tag";
import { NotificationEvent } from "@/server/models/NotificationEvent";
import { NotificationGroup } from "@/server/models/NotificationGroup";
import { SavedSummary } from "@/server/models/SavedSummary";
import { SummaryComment } from "@/server/models/SummaryComment";
import { SummaryLike } from "@/server/models/SummaryLike";
import { emitAuditEventV1 } from "@/server/security/audit";
import { maybeRunRiskContentHook } from "@/server/security/risk";
import {
  deriveSummaryTitle,
  extractTitleAndSummary,
  isPlaceholderSummaryTitle,
  sanitizeSummaryText,
} from "@/server/summaryderive";

export const runtime = "nodejs";

function normalizeVisibility(value: unknown): SummaryVisibility {
  if (value === "public" || value === "private") return value;
  return "private";
}

function summaryStarred(doc: { starred?: boolean }): boolean {
  return doc.starred === true;
}

type Ctx = { params: Promise<{ id: string }> };

export function GET(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const doc = await Summary.findOne({ _id: id, userId }).populate("tags", "name color").lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      platform: doc.platform,
      summaryText: doc.summaryText,
      url: doc.url,
      workspaceId: doc.workspaceId?.toString() || null,
      tags: doc.tags || [],
      createdAt: doc.createdAt,
      visibility: normalizeVisibility((doc as { visibility?: string }).visibility),
      starred: summaryStarred(doc as { starred?: boolean }),
    });
  });
}

export function PUT(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      await emitAuditEventV1(request, {
        eventType: "summary.updated",
        actorUserId: "unknown",
        targetType: "summary",
        targetId: (await ctx.params).id,
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = (await request.json()) as {
      title?: string;
      summaryText?: string;
      platform?: string;
      url?: string;
      workspaceId?: string | null;
      tags?: string[];
      visibility?: string;
      starred?: boolean;
    };

    const { title, summaryText, platform, url, workspaceId, tags, visibility, starred } = body;

    const updateData: Record<string, unknown> = {};

    let cleanedIncomingSummaryText: string | undefined = undefined;
    let extractedIncomingTitle: string | null = null;
    if (summaryText !== undefined) {
      const extracted = extractTitleAndSummary(String(summaryText));
      cleanedIncomingSummaryText = sanitizeSummaryText(extracted.summaryText);
      extractedIncomingTitle = extracted.title;
      updateData.summaryText = cleanedIncomingSummaryText;
    }

    if (title !== undefined) {
      let resolvedTitle = title.trim();
      if (!resolvedTitle || isPlaceholderSummaryTitle(resolvedTitle)) {
        let baseText = cleanedIncomingSummaryText ?? summaryText;
        if (baseText === undefined) {
          const existing = await Summary.findOne({ _id: id, userId }).select("summaryText").lean();
          baseText = existing?.summaryText ?? "";
        }
        resolvedTitle = (extractedIncomingTitle ?? "").trim() || deriveSummaryTitle(String(baseText));
      }
      updateData.title = resolvedTitle;
    }
    if (platform !== undefined) updateData.platform = platform;
    if (url !== undefined) updateData.url = url;
    if (workspaceId !== undefined) {
      updateData.workspaceId = workspaceId && String(workspaceId).length ? workspaceId : null;
    }
    if (tags !== undefined) updateData.tags = tags;
    if (visibility !== undefined) updateData.visibility = normalizeVisibility(visibility);
    if (starred !== undefined) {
      if (typeof starred !== "boolean") {
        await emitAuditEventV1(request, {
          eventType: "summary.updated",
          actorUserId: userId,
          targetType: "summary",
          targetId: id,
          result: "invalid",
          metadata: { starred },
        });
        return NextResponse.json({ error: "starred must be a boolean" }, { status: 400 });
      }
      updateData.starred = starred;
    }

    await maybeRunRiskContentHook({
      request,
      actorUserId: userId,
      targetType: "summary",
      eventType: "risk.decision.summary_update",
      metadata: {
        hasTitle: title !== undefined,
        hasSummaryText: summaryText !== undefined,
        hasPlatform: platform !== undefined,
        hasUrl: url !== undefined,
        visibility: visibility !== undefined ? normalizeVisibility(visibility) : undefined,
        hasTags: tags !== undefined,
        hasStarred: starred !== undefined,
        incomingSummaryTextLength: cleanedIncomingSummaryText?.length,
      },
    });

    const doc = await Summary.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true },
    )
      .populate("tags", "name color")
      .lean();

    if (!doc) {
      await emitAuditEventV1(request, {
        eventType: "summary.updated",
        actorUserId: userId,
        targetType: "summary",
        targetId: id,
        result: "not_found",
      });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const eventType = visibility !== undefined ? "summary.visibility_changed" : "summary.updated";
    await emitAuditEventV1(request, {
      eventType,
      actorUserId: userId,
      targetType: "summary",
      targetId: doc._id.toString(),
      result: "ok",
      metadata: {
        workspaceId: doc.workspaceId ? doc.workspaceId.toString() : null,
        visibility: visibility !== undefined ? normalizeVisibility(visibility) : undefined,
      },
    });

    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      platform: doc.platform,
      summaryText: doc.summaryText,
      workspaceId: doc.workspaceId ? doc.workspaceId.toString() : null,
      tags: doc.tags || [],
      visibility: normalizeVisibility((doc as { visibility?: string }).visibility),
      starred: summaryStarred(doc as { starred?: boolean }),
    });
  });
}

export function DELETE(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      const { id } = await ctx.params;
      await emitAuditEventV1(request, {
        eventType: "summary.deleted",
        actorUserId: "unknown",
        targetType: "summary",
        targetId: id,
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const existing = await Summary.findOne({ _id: id, userId }).select("_id").lean();
    if (!existing) {
      await emitAuditEventV1(request, {
        eventType: "summary.deleted",
        actorUserId: userId,
        targetType: "summary",
        targetId: id,
        result: "not_found",
      });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      await Promise.all([
        SummaryComment.deleteMany({ summaryId: id }),
        SummaryLike.deleteMany({ summaryId: id }),
        SavedSummary.deleteMany({ summaryId: id }),
        NotificationEvent.deleteMany({ summaryId: id }),
        NotificationGroup.deleteMany({ summaryId: id }),
      ]);

      await Summary.deleteOne({ _id: id, userId });
    } catch (err) {
      await emitAuditEventV1(request, {
        eventType: "summary.deleted",
        actorUserId: userId,
        targetType: "summary",
        targetId: id,
        result: "error",
        metadata: { error: (err as Error)?.message || String(err) },
      });
      throw err;
    }

    await emitAuditEventV1(request, {
      eventType: "summary.deleted",
      actorUserId: userId,
      targetType: "summary",
      targetId: id,
      result: "ok",
    });
    return new NextResponse(null, { status: 204 });
  });
}
