import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { Tag } from "@/server/models/Tag";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export function GET(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const tag = await Tag.findOne({ _id: id, userId }).lean();
    if (!tag) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: tag._id.toString(),
      name: tag.name,
      color: tag.color,
    });
  });
}

export function PUT(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      const { id } = await ctx.params;
      await emitAuditEventV1(request, {
        eventType: "tag.updated",
        actorUserId: "unknown",
        targetType: "tag",
        targetId: id,
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { name?: string; color?: string };
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const nextName = String(body.name).trim();
      if (!nextName) {
        const { id } = await ctx.params;
        await emitAuditEventV1(request, {
          eventType: "tag.updated",
          actorUserId: userId,
          targetType: "tag",
          targetId: id,
          result: "invalid",
        });
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      updateData.name = nextName;
    }
    if (body.color !== undefined) {
      updateData.color = body.color;
    }

    const { id } = await ctx.params;
    try {
      const tag = await Tag.findOneAndUpdate({ _id: id, userId }, { $set: updateData }, { new: true }).lean();
      if (!tag) {
        await emitAuditEventV1(request, {
          eventType: "tag.updated",
          actorUserId: userId,
          targetType: "tag",
          targetId: id,
          result: "not_found",
        });
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      await emitAuditEventV1(request, {
        eventType: "tag.updated",
        actorUserId: userId,
        targetType: "tag",
        targetId: id,
        result: "ok",
        metadata: { name: tag.name, color: tag.color },
      });
      return NextResponse.json({
        id: tag._id.toString(),
        name: tag.name,
        color: tag.color,
      });
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 11000) {
        await emitAuditEventV1(request, {
          eventType: "tag.updated",
          actorUserId: userId,
          targetType: "tag",
          targetId: id,
          result: "invalid",
        });
        return NextResponse.json({ error: "Tag already exists" }, { status: 400 });
      }
      await emitAuditEventV1(request, {
        eventType: "tag.updated",
        actorUserId: userId,
        targetType: "tag",
        targetId: id,
        result: "error",
        metadata: { error: String((err as Error)?.message ?? err) },
      });
      return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
    }
  });
}

export function DELETE(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      const { id } = await ctx.params;
      await emitAuditEventV1(request, {
        eventType: "tag.deleted",
        actorUserId: "unknown",
        targetType: "tag",
        targetId: id,
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const deleted = await Tag.deleteOne({ _id: id, userId });
    await emitAuditEventV1(request, {
      eventType: "tag.deleted",
      actorUserId: userId,
      targetType: "tag",
      targetId: id,
      result: deleted.deletedCount === 1 ? "ok" : "not_found",
    });
    return new NextResponse(null, { status: 204 });
  });
}
