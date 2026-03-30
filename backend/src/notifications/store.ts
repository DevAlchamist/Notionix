import mongoose from "mongoose";
import { NotificationEvent, type NotificationEventType } from "../models/NotificationEvent";
import { NotificationGroup } from "../models/NotificationGroup";

function toObjectId(id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

function pushActor(last: mongoose.Types.ObjectId[], actorId: mongoose.Types.ObjectId, max: number): mongoose.Types.ObjectId[] {
  const next = [actorId, ...last.filter((x) => x.toString() !== actorId.toString())];
  return next.slice(0, max);
}

export async function createNotificationEvent(input: {
  ownerId: string;
  actorId: string;
  summaryId: string;
  eventType: NotificationEventType;
  commentId?: string;
}): Promise<{ eventId: string }> {
  const ownerId = toObjectId(input.ownerId);
  const actorId = toObjectId(input.actorId);
  const summaryId = toObjectId(input.summaryId);

  const event = await NotificationEvent.create({
    ownerId,
    actorId,
    summaryId,
    eventType: input.eventType,
    ...(input.commentId ? { commentId: toObjectId(input.commentId) } : {}),
  });
  return { eventId: event._id.toString() };
}

export async function markAllNotificationsSeen(ownerId: string): Promise<void> {
  const oid = toObjectId(ownerId);
  const now = new Date();

  const unseen = await NotificationEvent.find({ ownerId: oid, seenAt: { $exists: false } })
    .select("_id actorId summaryId eventType createdAt")
    .sort({ createdAt: -1 })
    .lean();

  if (unseen.length === 0) return;

  await NotificationEvent.updateMany(
    { _id: { $in: unseen.map((e) => e._id) } },
    { $set: { seenAt: now } },
  );

  // After first view, fold previously-new events into grouped “older” rows.
  for (const e of unseen) {
    const key = { ownerId: oid, summaryId: e.summaryId, eventType: e.eventType };
    const existing = await NotificationGroup.findOne(key).select("_id lastActorIds").lean();
    if (!existing) {
      await NotificationGroup.create({
        ...key,
        count: 1,
        lastActorIds: [e.actorId],
        lastEventAt: e.createdAt,
        seenAt: now,
      });
      continue;
    }

    const nextActors = pushActor((existing.lastActorIds as mongoose.Types.ObjectId[] | undefined) ?? [], e.actorId, 3);
    await NotificationGroup.updateOne(
      { _id: existing._id },
      {
        $inc: { count: 1 },
        $set: { lastActorIds: nextActors, lastEventAt: e.createdAt, seenAt: now },
      },
    );
  }
}

export async function unreadCount(ownerId: string): Promise<number> {
  const oid = toObjectId(ownerId);
  return NotificationEvent.countDocuments({ ownerId: oid, seenAt: { $exists: false } });
}

