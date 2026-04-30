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

export function POST(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      await emitAuditEventV1(request, {
        eventType: "workspace.created",
        actorUserId: "unknown",
        targetType: "workspace",
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      tags?: string[];
    };

    const { name, description, tags } = body;

    if (!name) {
      await emitAuditEventV1(request, {
        eventType: "workspace.created",
        actorUserId: userId,
        targetType: "workspace",
        result: "invalid",
      });
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    try {
      const tagIds = await resolveWorkspaceTagIds(userId, tags);
      const docData: Record<string, unknown> = { userId, name, tags: tagIds };
      if (description !== undefined) docData.description = description;

      const doc = await Workspace.create(docData);

      await emitAuditEventV1(request, {
        eventType: "workspace.created",
        actorUserId: userId,
        targetType: "workspace",
        targetId: doc.id,
        result: "ok",
        metadata: {
          description: doc.description,
          tagsCount: Array.isArray(doc.tags) ? doc.tags.length : undefined,
        },
      });

      return NextResponse.json(
        {
          id: doc.id,
          name: doc.name,
          description: doc.description,
          tags: doc.tags,
        },
        { status: 201 },
      );
    } catch {
      await emitAuditEventV1(request, {
        eventType: "workspace.created",
        actorUserId: userId,
        targetType: "workspace",
        result: "error",
      });
      return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
    }
  });
}

export function GET(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceQuery: Record<string, unknown> = { userId };
    const starred = request.nextUrl.searchParams.get("starred");
    if (starred === "true" || starred === "1") {
      workspaceQuery.starred = true;
    }

    const items = await Workspace.find(workspaceQuery)
      .populate("tags", "name color")
      .sort({ createdAt: -1 })
      .lean();

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const summaryCounts = userObjectId
      ? await Summary.aggregate([
          {
            $match: {
              userId: userObjectId,
              workspaceId: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: "$workspaceId", count: { $sum: 1 } } },
        ])
      : [];

    const summaryCountByWorkspaceId = new Map(
      summaryCounts.map((entry: { _id: unknown; count: number }) => [String(entry._id), entry.count]),
    );

    return NextResponse.json({
      items: items.map((w) => {
        const count = summaryCountByWorkspaceId.get(w._id.toString()) ?? 0;
        return {
          id: w._id.toString(),
          name: w.name,
          description: w.description,
          tags: w.tags,
          createdAt: w.createdAt,
          starred: workspaceStarred(w as { starred?: boolean }),
          summaryCount: count,
          summariesLength: count,
        };
      }),
    });
  });
}
