import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { Summary, type SummaryVisibility } from "@/server/models/Summary";
import { Tag } from "@/server/models/Tag";
import {
  deriveSummaryTitle,
  extractTitleAndSummary,
  isPlaceholderSummaryTitle,
  sanitizeSummaryText,
} from "@/server/summaryderive";
import { emitAuditEventV1 } from "@/server/security/audit";
import { maybeRunRiskContentHook } from "@/server/security/risk";

export const runtime = "nodejs";

function createPreview(summaryText: unknown, max = 180): string {
  const text = typeof summaryText === "string" ? summaryText.replace(/\s+/g, " ").trim() : "";
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

function escapeRegex(raw: string): string {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeVisibility(value: unknown): SummaryVisibility {
  if (value === "public" || value === "private") return value;
  return "private";
}

function summaryStarred(doc: { starred?: boolean }): boolean {
  return doc.starred === true;
}

export function POST(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      await emitAuditEventV1(request, {
        eventType: "summary.created",
        actorUserId: "unknown",
        targetType: "summary",
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      platform?: string;
      title?: string;
      summaryText?: string;
      url?: string;
      createdAt?: string;
      workspaceId?: string;
      tags?: string[];
      visibility?: string;
    };

    const { platform, title, summaryText, url, createdAt, workspaceId, tags, visibility } = body;

    if (!platform || !summaryText || !url) {
      await emitAuditEventV1(request, {
        eventType: "summary.created",
        actorUserId: userId,
        targetType: "summary",
        result: "invalid",
        metadata: { hasPlatform: Boolean(platform), hasSummaryText: Boolean(summaryText), hasUrl: Boolean(url) },
      });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const extracted = extractTitleAndSummary(summaryText);
    const cleanedSummaryText = sanitizeSummaryText(extracted.summaryText);

    let resolvedTitle = (title ?? "").trim();
    if (!resolvedTitle || isPlaceholderSummaryTitle(resolvedTitle)) {
      resolvedTitle = (extracted.title ?? "").trim() || deriveSummaryTitle(cleanedSummaryText);
    }

    const docData: Record<string, unknown> = {
      userId,
      platform,
      title: resolvedTitle,
      summaryText: cleanedSummaryText,
      url,
      tags: tags || [],
      visibility: normalizeVisibility(visibility),
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    };
    if (workspaceId !== undefined) {
      docData.workspaceId = workspaceId;
    }

    await maybeRunRiskContentHook({
      request,
      actorUserId: userId,
      targetType: "summary",
      eventType: "risk.decision.summary_create",
      metadata: {
        platform,
        summaryTextLength: cleanedSummaryText.length,
        visibility: normalizeVisibility(visibility),
        workspaceId: workspaceId ?? null,
        tagsCount: Array.isArray(tags) ? tags.length : undefined,
      },
    });

    let doc: unknown;
    try {
      doc = await Summary.create(docData as Parameters<typeof Summary.create>[0]);
    } catch (err) {
      await emitAuditEventV1(request, {
        eventType: "summary.created",
        actorUserId: userId,
        targetType: "summary",
        result: "error",
        metadata: { error: (err as Error)?.message || String(err) },
      });
      throw err;
    }

    const createdDoc = Array.isArray(doc) ? doc[0] : doc;
    const docId = (createdDoc as { id?: unknown }).id;
    if (typeof docId !== "string" || !docId) {
      throw new Error("ArmorIQ summary create: missing created id");
    }

    await emitAuditEventV1(request, {
      eventType: "summary.created",
      actorUserId: userId,
      targetType: "summary",
      targetId: docId,
      result: "ok",
      metadata: {
        workspaceId: workspaceId ?? null,
        visibility: normalizeVisibility(visibility),
      },
    });

    return NextResponse.json({ id: docId }, { status: 201 });
  });
}

export function GET(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawLimit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);
    const rawQuery = String(request.nextUrl.searchParams.get("query") ?? "")
      .replace(/^#/, "")
      .trim()
      .replace(/\s+/g, " ");
    const limit = Math.min(
      Number.isFinite(rawLimit) ? rawLimit : rawQuery.length > 0 ? 50 : 20,
      50,
    );

    const query: Record<string, unknown> = { userId };
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }
    const starred = request.nextUrl.searchParams.get("starred");
    if (starred === "true" || starred === "1") {
      query.starred = true;
    }

    if (rawQuery.length > 0) {
      const titleRegex = new RegExp(escapeRegex(rawQuery), "i");
      const userObjectId =
        mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
      const tagDocs = userObjectId
        ? await Tag.find({ userId: userObjectId, name: titleRegex }).select("_id").lean()
        : [];
      const tagIds = tagDocs.map((t) => t._id).filter(Boolean);
      query.$or = [{ title: titleRegex }, { summaryText: titleRegex }, { tags: { $in: tagIds } }];
    }

    const items = await Summary.find(query)
      .populate("tags", "name color")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      items: items.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        platform: s.platform,
        workspaceId: s.workspaceId?.toString() || null,
        preview: createPreview((s as { summaryText?: string }).summaryText),
        tags: Array.isArray(s.tags)
          ? s.tags.map((tag) => {
              const t = tag as unknown as { _id?: unknown; name?: unknown; color?: unknown };
              return {
                _id: String(t?._id ?? ""),
                name: String(t?.name ?? ""),
                color: typeof t?.color === "string" ? (t.color as string) : undefined,
              };
            })
          : [],
        createdAt: s.createdAt,
        visibility: normalizeVisibility((s as { visibility?: string }).visibility),
        starred: summaryStarred(s as { starred?: boolean }),
      })),
    });
  });
}
