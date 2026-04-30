import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { Tag } from "@/server/models/Tag";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      await emitAuditEventV1(request, {
        eventType: "tag.created",
        actorUserId: "unknown",
        targetType: "tag",
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { name?: string; color?: string };
    const { name, color } = body;

    if (!name) {
      await emitAuditEventV1(request, {
        eventType: "tag.created",
        actorUserId: userId,
        targetType: "tag",
        result: "invalid",
      });
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    try {
      const docData: Record<string, unknown> = { userId, name };
      if (color !== undefined) docData.color = color;
      const doc = await Tag.create(docData);

      await emitAuditEventV1(request, {
        eventType: "tag.created",
        actorUserId: userId,
        targetType: "tag",
        targetId: doc.id,
        result: "ok",
        metadata: { color: doc.color },
      });
      return NextResponse.json({ id: doc.id, name: doc.name, color: doc.color }, { status: 201 });
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 11000) {
        await emitAuditEventV1(request, {
          eventType: "tag.created",
          actorUserId: userId,
          targetType: "tag",
          result: "invalid",
          metadata: { error: "tag already exists", name, color },
        });
        return NextResponse.json({ error: "Tag already exists" }, { status: 400 });
      }
      await emitAuditEventV1(request, {
        eventType: "tag.created",
        actorUserId: userId,
        targetType: "tag",
        result: "error",
        metadata: { error: String((err as Error)?.message ?? err) },
      });
      return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
    }
  });
}

export function GET(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await Tag.find({ userId }).sort({ name: 1 }).lean();

    return NextResponse.json({
      items: items.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        color: t.color,
      })),
    });
  });
}
