import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { Summary } from "@/server/models/Summary";
import { emitAuditEventV1 } from "@/server/security/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export function POST(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      const { id } = await ctx.params;
      await emitAuditEventV1(request, {
        eventType: "summary.share_enabled",
        actorUserId: "unknown",
        targetType: "summary",
        targetId: id,
        result: "denied",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = (await request.json()) as { enabled?: unknown };
    if (body.enabled !== true) {
      await emitAuditEventV1(request, {
        eventType: "summary.share_enabled",
        actorUserId: userId,
        targetType: "summary",
        targetId: id,
        result: "invalid",
        metadata: { enabled: body.enabled },
      });
      return NextResponse.json({ error: "enabled must be true" }, { status: 400 });
    }

    const doc = await Summary.findOneAndUpdate(
      { _id: id, userId },
      { $set: { shareEnabled: true } },
      { new: true },
    )
      .select("_id shareEnabled")
      .lean();

    if (!doc) {
      await emitAuditEventV1(request, {
        eventType: "summary.share_enabled",
        actorUserId: userId,
        targetType: "summary",
        targetId: id,
        result: "not_found",
      });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await emitAuditEventV1(request, {
      eventType: "summary.share_enabled",
      actorUserId: userId,
      targetType: "summary",
      targetId: id,
      result: "ok",
      metadata: { shareEnabled: true },
    });
    return NextResponse.json({ ok: true });
  });
}
