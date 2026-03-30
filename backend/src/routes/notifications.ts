import express from "express";
import mongoose from "mongoose";
import { NotificationEvent } from "../models/NotificationEvent";
import { NotificationGroup } from "../models/NotificationGroup";
import { markAllNotificationsSeen, unreadCount } from "../notifications/store";
import { sseAddClient, ssePublish, sseRemoveClient } from "../notifications/sseHub";

const router = express.Router();

function requireUserId(req: express.Request, res: express.Response): string | null {
  const userId = (req as express.Request & { userId?: string }).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

router.get("/unread-count", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const unread = await unreadCount(userId);
  res.json({ unread });
});

router.get("/list", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1), 50);
  const groupLimit = Math.min(Math.max(parseInt(String(req.query.groupLimit || "20"), 10) || 20, 1), 50);

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

  res.json({
    newEvents: newEvents.map((e) => ({
      id: e._id.toString(),
      eventType: e.eventType,
      createdAt: e.createdAt,
      seenAt: (e as { seenAt?: Date }).seenAt ?? null,
      actor: (() => {
        const a = e.actorId as any;
        if (!a?._id) return null;
        const base: any = { id: a._id.toString(), name: a.name ?? "User" };
        if (a.avatar) base.avatar = a.avatar;
        return base;
      })(),
      summary: (() => {
        const s = e.summaryId as any;
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
        const s = g.summaryId as any;
        if (!s?._id) return null;
        return { id: s._id.toString(), title: s.title ?? "Summary" };
      })(),
      actors: Array.isArray(g.lastActorIds)
        ? (g.lastActorIds as any[]).map((a) => {
            const base: any = { id: a._id?.toString?.() ?? "", name: a.name ?? "User" };
            if (a.avatar) base.avatar = a.avatar;
            return base;
          })
        : [],
    })),
  });
});

router.post("/mark-seen", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  await markAllNotificationsSeen(userId);
  const unread = await unreadCount(userId);
  ssePublish(userId, { unread, refresh: true });
  res.json({ ok: true, unread });
});

router.get("/stream", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  sseAddClient(userId, res);

  // Initial unread push
  const unread = await unreadCount(userId);
  res.write(`event: unread\n`);
  res.write(`data: ${JSON.stringify({ unread })}\n\n`);

  // Keepalive to prevent idle timeouts
  const keepAlive = setInterval(() => {
    try {
      res.write(":\n\n");
    } catch {
      // ignore
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(keepAlive);
    sseRemoveClient(userId, res);
  });
});

export default router;

