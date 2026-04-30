import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { NotificationEvent } from "@/server/models/NotificationEvent";
import { NotificationGroup } from "@/server/models/NotificationGroup";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = Math.min(
      Math.max(parseInt(String(request.nextUrl.searchParams.get("limit") || "20"), 10) || 20, 1),
      50,
    );
    const groupLimit = Math.min(
      Math.max(parseInt(String(request.nextUrl.searchParams.get("groupLimit") || "20"), 10) || 20, 1),
      50,
    );

    const ownerId = new mongoose.Types.ObjectId(userId);

    const [newEvents, olderGroups] = await Promise.all([
      NotificationEvent.find({ ownerId, seenAt: { $exists: false } })
        .populate("actorId", "name avatar")
        .populate("summaryId", "title")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      NotificationGroup.find({ ownerId })
        .populate("summaryId", "title")
        .populate("lastActorIds", "name avatar")
        .sort({ lastEventAt: -1 })
        .limit(groupLimit)
        .lean(),
    ]);

    return NextResponse.json({
      newEvents: newEvents.map((e) => ({
        id: e._id.toString(),
        eventType: e.eventType,
        createdAt: e.createdAt,
        seenAt: (e as { seenAt?: Date }).seenAt ?? null,
        actor: (() => {
          const a = e.actorId as { _id?: mongoose.Types.ObjectId; name?: string; avatar?: string } | null;
          if (!a?._id) return null;
          const base: { id: string; name: string; avatar?: string } = {
            id: a._id.toString(),
            name: a.name ?? "User",
          };
          if (a.avatar) base.avatar = a.avatar;
          return base;
        })(),
        summary: (() => {
          const s = e.summaryId as { _id?: mongoose.Types.ObjectId; title?: string } | null;
          if (!s?._id) return null;
          return { id: s._id.toString(), title: s.title ?? "Summary" };
        })(),
      })),
      olderGroups: olderGroups.map((g) => ({
        id: g._id.toString(),
        eventType: g.eventType,
        count: g.count,
        lastEventAt: g.lastEventAt,
        seenAt: (g as { seenAt?: Date }).seenAt ?? null,
        summary: (() => {
          const s = g.summaryId as { _id?: mongoose.Types.ObjectId; title?: string } | null;
          if (!s?._id) return null;
          return { id: s._id.toString(), title: s.title ?? "Summary" };
        })(),
        actors: Array.isArray(g.lastActorIds)
          ? (g.lastActorIds as { _id?: mongoose.Types.ObjectId; name?: string; avatar?: string }[]).map((a) => {
              const base: { id: string; name: string; avatar?: string } = {
                id: a._id?.toString?.() ?? "",
                name: a.name ?? "User",
              };
              if (a.avatar) base.avatar = a.avatar;
              return base;
            })
          : [],
      })),
    });
  });
}
