import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { Workspace } from "@/server/models/Workspace";
import { Summary } from "@/server/models/Summary";
import { Tag } from "@/server/models/Tag";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

function workspaceStarred(doc: { starred?: boolean }): boolean {
  return doc.starred === true;
}

function summaryStarred(doc: { starred?: boolean }): boolean {
  return doc.starred === true;
}

async function resolveWorkspaceTagIds(userId: string, tagsInput?: string[]) {
  if (!Array.isArray(tagsInput) || tagsInput.length === 0) return [];

  const resolvedIds: string[] = [];

  for (const rawTag of tagsInput) {
    const value = String(rawTag ?? "").trim();
    if (!value) continue;

    if (mongoose.Types.ObjectId.isValid(value)) {
      resolvedIds.push(value);
      continue;
    }

    const existing = await Tag.findOne({ userId, name: value }).lean();
    if (existing?._id) {
      resolvedIds.push(existing._id.toString());
      continue;
    }

    const created = await Tag.create({ userId, name: value });
    resolvedIds.push(created._id.toString());
  }

  return resolvedIds;
}

type Ctx = { params: Promise<{ id: string }> };

export function GET(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      const { id } = await ctx.params;
      await emitAuditEventV1(request, {
        eventType: "workspace.updated",
        actorUserId: "unknown",
        targetType: "workspace",
        targetId: id,
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const doc = await Workspace.findOne({ _id: id, userId }).populate("tags", "name color").lean();

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const summaries = await Summary.find({ workspaceId: doc._id, userId }).sort({ createdAt: -1 }).lean();

    const previewFromText = (text: string, max = 220) => {
      const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
      if (normalized.length <= max) return normalized;
      return `${normalized.slice(0, max - 1).trimEnd()}…`;
    };

    const summaryCount = summaries.length;

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      tags: doc.tags,
      createdAt: doc.createdAt,
      starred: workspaceStarred(doc as { starred?: boolean }),
      summaryCount,
      summariesLength: summaryCount,
      summaries: summaries.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        platform: s.platform,
        createdAt: s.createdAt,
        url: s.url,
        preview: previewFromText(s.summaryText),
        visibility: (s as { visibility?: string }).visibility === "public" ? "public" : "private",
        starred: summaryStarred(s as { starred?: boolean }),
      })),
    });
  });
}

export function PUT(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      tags?: string[];
      starred?: boolean;
    };

    const { name, description, tags, starred } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) {
      updateData.tags = await resolveWorkspaceTagIds(userId, tags);
    }
    if (starred !== undefined) {
      if (typeof starred !== "boolean") {
        await emitAuditEventV1(request, {
          eventType: "workspace.updated",
          actorUserId: userId,
          targetType: "workspace",
          targetId: id,
          result: "invalid",
          metadata: { starred },
        });
        return NextResponse.json({ error: "starred must be a boolean" }, { status: 400 });
      }
      updateData.starred = starred;
    }

    const doc = await Workspace.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true },
    )
      .populate("tags", "name color")
      .lean();

    if (!doc) {
      await emitAuditEventV1(request, {
        eventType: "workspace.updated",
        actorUserId: userId,
        targetType: "workspace",
        targetId: id,
        result: "not_found",
      });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await emitAuditEventV1(request, {
      eventType: "workspace.updated",
      actorUserId: userId,
      targetType: "workspace",
      targetId: doc._id.toString(),
      result: "ok",
      metadata: {
        description: doc.description,
        tagsCount: Array.isArray(doc.tags) ? doc.tags.length : undefined,
      },
    });

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      tags: doc.tags,
      starred: workspaceStarred(doc as { starred?: boolean }),
    });
  });
}

export function DELETE(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      const { id } = await ctx.params;
      await emitAuditEventV1(request, {
        eventType: "workspace.deleted",
        actorUserId: "unknown",
        targetType: "workspace",
        targetId: id,
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;

    try {
      await Summary.updateMany({ workspaceId: id, userId }, { $unset: { workspaceId: 1 } });

      const deleted = await Workspace.deleteOne({ _id: id, userId });
      await emitAuditEventV1(request, {
        eventType: "workspace.deleted",
        actorUserId: userId,
        targetType: "workspace",
        targetId: id,
        result: deleted.deletedCount === 1 ? "ok" : "not_found",
      });
    } catch (err) {
      await emitAuditEventV1(request, {
        eventType: "workspace.deleted",
        actorUserId: userId,
        targetType: "workspace",
        targetId: id,
        result: "error",
        metadata: { error: (err as Error)?.message || String(err) },
      });
      throw err;
    }
    return new NextResponse(null, { status: 204 });
  });
}
