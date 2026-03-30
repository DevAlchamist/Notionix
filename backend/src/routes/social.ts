import express from "express";
import mongoose from "mongoose";
import { Summary } from "../models/Summary";
import { SummaryLike } from "../models/SummaryLike";
import { SummaryComment, SUMMARY_COMMENT_MAX_BODY } from "../models/SummaryComment";
import { SavedSummary } from "../models/SavedSummary";
import type { SummaryVisibility } from "../models/Summary";
import { createNotificationEvent, unreadCount } from "../notifications/store";
import { ssePublish } from "../notifications/sseHub";

const router = express.Router();

function normalizeVisibility(value: unknown): SummaryVisibility {
  if (value === "public" || value === "private") return value;
  return "private";
}

function requireUserId(req: express.Request, res: express.Response): string | null {
  const userId = (req as express.Request & { userId?: string }).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

async function assertPublicSummary(
  res: express.Response,
  summaryId: string,
): Promise<{ _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId } | null> {
  if (!mongoose.isValidObjectId(summaryId)) {
    res.status(404).json({ error: "Not found" });
    return null;
  }

  const doc = await Summary.findById(summaryId).select("_id userId visibility").lean();
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return null;
  }
  if (normalizeVisibility(doc.visibility) !== "public") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return doc;
}

function previewText(text: string, max = 400): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

function authorFromPopulated(userId: unknown): { id: string; name: string; avatar?: string } {
  if (userId && typeof userId === "object" && "_id" in userId) {
    const u = userId as { _id: mongoose.Types.ObjectId; name?: string; avatar?: string };
    const base = { id: u._id.toString(), name: u.name ?? "User" };
    return u.avatar !== undefined && u.avatar !== "" ? { ...base, avatar: u.avatar } : base;
  }
  return { id: "", name: "User" };
}

function ownerIdFromSummaryUserField(userIdField: unknown): string | undefined {
  if (!userIdField) return undefined;
  if (typeof userIdField === "object" && "_id" in userIdField) {
    return String((userIdField as { _id: mongoose.Types.ObjectId })._id);
  }
  if (userIdField instanceof mongoose.Types.ObjectId) {
    return userIdField.toString();
  }
  return undefined;
}

async function engagementMapsForSummaries(
  summaryIds: string[],
  currentUserId: string,
): Promise<{
  likeCount: Map<string, number>;
  commentCount: Map<string, number>;
  likedIds: Set<string>;
  savedIds: Set<string>;
}> {
  const oids = summaryIds.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id));
  if (oids.length === 0) {
    return {
      likeCount: new Map(),
      commentCount: new Map(),
      likedIds: new Set(),
      savedIds: new Set(),
    };
  }

  const uid = new mongoose.Types.ObjectId(currentUserId);

  const [likeAgg, commentAgg, myLikes, mySaves] = await Promise.all([
    SummaryLike.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { summaryId: { $in: oids } } },
      { $group: { _id: "$summaryId", count: { $sum: 1 } } },
    ]),
    SummaryComment.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { summaryId: { $in: oids } } },
      { $group: { _id: "$summaryId", count: { $sum: 1 } } },
    ]),
    SummaryLike.find({ userId: uid, summaryId: { $in: oids } }).select("summaryId").lean(),
    SavedSummary.find({ userId: uid, summaryId: { $in: oids } }).select("summaryId").lean(),
  ]);

  const likeCount = new Map(likeAgg.map((x) => [x._id.toString(), x.count]));
  const commentCount = new Map(commentAgg.map((x) => [x._id.toString(), x.count]));
  const likedIds = new Set(myLikes.map((d) => d.summaryId!.toString()));
  const savedIds = new Set(mySaves.map((d) => d.summaryId!.toString()));

  return { likeCount, commentCount, likedIds, savedIds };
}

router.get("/feed", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1), 50);
  const skip = Math.max(parseInt(String(req.query.skip || "0"), 10) || 0, 0);

  const items = await Summary.find({ visibility: "public" })
    .populate("userId", "name avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const ids = items.map((s) => s._id.toString());
  const { likeCount, commentCount, likedIds, savedIds } = await engagementMapsForSummaries(ids, userId);

  res.json({
    items: items.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      platform: s.platform,
      preview: previewText(s.summaryText),
      summaryText: s.summaryText,
      url: s.url,
      createdAt: s.createdAt,
      author: authorFromPopulated(s.userId),
      likeCount: likeCount.get(s._id.toString()) ?? 0,
      commentCount: commentCount.get(s._id.toString()) ?? 0,
      likedByMe: likedIds.has(s._id.toString()),
      savedByMe: savedIds.has(s._id.toString()),
      ownerId: ownerIdFromSummaryUserField(s.userId),
    })),
    hasMore: items.length === limit,
  });
});

router.get("/summaries/:id", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.id;
  const pub = await assertPublicSummary(res, id);
  if (!pub) return;

  const doc = await Summary.findById(id).populate("userId", "name avatar").populate("tags", "name color").lean();
  if (!doc) {
    return res.status(404).json({ error: "Not found" });
  }

  const { likeCount, commentCount, likedIds, savedIds } = await engagementMapsForSummaries([id], userId);

  res.json({
    id: doc._id.toString(),
    title: doc.title,
    platform: doc.platform,
    summaryText: doc.summaryText,
    url: doc.url,
    createdAt: doc.createdAt,
    tags: doc.tags || [],
    author: authorFromPopulated(doc.userId),
    ownerId: pub.userId.toString(),
    likeCount: likeCount.get(id) ?? 0,
    commentCount: commentCount.get(id) ?? 0,
    likedByMe: likedIds.has(id),
    savedByMe: savedIds.has(id),
  });
});

router.post("/summaries/:id/like", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.id;
  const pub = await assertPublicSummary(res, id);
  if (!pub) return;

  try {
    await SummaryLike.create({
      userId,
      summaryId: id,
    });
  } catch (e: unknown) {
    if ((e as { code?: number })?.code === 11000) {
      const likeCount = await SummaryLike.countDocuments({ summaryId: id });
      return res.json({ liked: true, likeCount });
    }
    throw e;
  }

  // Notify owner on first-time like (not on duplicate).
  const ownerId = pub.userId.toString();
  if (ownerId !== userId) {
    await createNotificationEvent({
      ownerId,
      actorId: userId,
      summaryId: id,
      eventType: "like",
    });
    const unread = await unreadCount(ownerId);
    ssePublish(ownerId, { unread, refresh: true });
  }

  const likeCount = await SummaryLike.countDocuments({ summaryId: id });
  res.status(201).json({ liked: true, likeCount });
});

router.delete("/summaries/:id/like", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.id;
  const pub = await assertPublicSummary(res, id);
  if (!pub) return;

  await SummaryLike.deleteOne({ summaryId: id, userId });
  const likeCount = await SummaryLike.countDocuments({ summaryId: id });
  res.json({ liked: false, likeCount });
});

router.post("/summaries/:id/save", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.id;
  const pub = await assertPublicSummary(res, id);
  if (!pub) return;

  try {
    await SavedSummary.create({ userId, summaryId: id });
  } catch (e: unknown) {
    if ((e as { code?: number })?.code === 11000) {
      return res.json({ saved: true });
    }
    throw e;
  }

  const ownerId = pub.userId.toString();
  if (ownerId !== userId) {
    await createNotificationEvent({
      ownerId,
      actorId: userId,
      summaryId: id,
      eventType: "save",
    });
    const unread = await unreadCount(ownerId);
    ssePublish(ownerId, { unread, refresh: true });
  }

  res.status(201).json({ saved: true });
});

router.delete("/summaries/:id/save", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.id;
  const pub = await assertPublicSummary(res, id);
  if (!pub) return;

  await SavedSummary.deleteOne({ summaryId: id, userId });
  res.json({ saved: false });
});

router.get("/summaries/:id/comments", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.id;
  const pub = await assertPublicSummary(res, id);
  if (!pub) return;

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || "30"), 10) || 30, 1), 100);
  const skip = Math.max(parseInt(String(req.query.skip || "0"), 10) || 0, 0);

  const comments = await SummaryComment.find({ summaryId: id })
    .populate("userId", "name avatar")
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({
    items: comments.map((c) => ({
      id: c._id.toString(),
      body: c.body,
      createdAt: c.createdAt,
      author: authorFromPopulated(c.userId),
      userId: (c.userId as { _id?: mongoose.Types.ObjectId })?._id?.toString() ?? "",
    })),
    hasMore: comments.length === limit,
  });
});

router.post("/summaries/:id/comments", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.id;
  const pub = await assertPublicSummary(res, id);
  if (!pub) return;

  const body = String((req.body as { body?: unknown })?.body ?? "").trim();
  if (!body) {
    return res.status(400).json({ error: "body is required" });
  }
  if (body.length > SUMMARY_COMMENT_MAX_BODY) {
    return res.status(400).json({ error: `body must be at most ${SUMMARY_COMMENT_MAX_BODY} characters` });
  }

  const doc = await SummaryComment.create({
    userId,
    summaryId: id,
    body,
  });

  const ownerId = pub.userId.toString();
  if (ownerId !== userId) {
    await createNotificationEvent({
      ownerId,
      actorId: userId,
      summaryId: id,
      eventType: "comment",
      commentId: doc._id.toString(),
    });
    const unread = await unreadCount(ownerId);
    ssePublish(ownerId, { unread, refresh: true });
  }

  const populated = await SummaryComment.findById(doc._id).populate("userId", "name avatar").lean();
  if (!populated) {
    return res.status(201).json({
      id: doc._id.toString(),
      body,
      createdAt: doc.createdAt,
      author: authorFromPopulated({ _id: new mongoose.Types.ObjectId(userId) }),
      userId,
    });
  }

  res.status(201).json({
    id: populated._id.toString(),
    body: populated.body,
    createdAt: populated.createdAt,
    author: authorFromPopulated(populated.userId),
    userId,
  });
});

router.delete("/summaries/:id/comments/:commentId", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const { id: summaryId, commentId } = req.params;
  const pub = await assertPublicSummary(res, summaryId);
  if (!pub) return;

  if (!mongoose.isValidObjectId(commentId)) {
    return res.status(404).json({ error: "Not found" });
  }

  const comment = await SummaryComment.findOne({ _id: commentId, summaryId }).lean();
  if (!comment) {
    return res.status(404).json({ error: "Not found" });
  }

  const isAuthor = comment.userId.toString() === userId;
  const isSummaryOwner = pub.userId.toString() === userId;
  if (!isAuthor && !isSummaryOwner) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await SummaryComment.deleteOne({ _id: commentId, summaryId });
  res.status(204).send();
});

router.get("/saved", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1), 50);
  const skip = Math.max(parseInt(String(req.query.skip || "0"), 10) || 0, 0);

  const bookmarks = await SavedSummary.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const summaryIds = bookmarks.map((b) => b.summaryId.toString());
  const summaries = await Summary.find({
    _id: { $in: summaryIds.map((sid) => new mongoose.Types.ObjectId(sid)) },
    visibility: "public",
  })
    .populate("userId", "name avatar")
    .lean();

  const byId = new Map(summaries.map((s) => [s._id.toString(), s]));

  const filteredIds = summaries.map((s) => s._id.toString());
  const { likeCount, commentCount, likedIds, savedIds } = await engagementMapsForSummaries(filteredIds, userId);

  const items = bookmarks
    .map((b) => {
      const s = byId.get(b.summaryId.toString());
      if (!s) return null;
      const sid = s._id.toString();
      return {
        bookmarkedAt: b.createdAt,
        id: sid,
        title: s.title,
        platform: s.platform,
        preview: previewText(s.summaryText),
        summaryText: s.summaryText,
        url: s.url,
        createdAt: s.createdAt,
        author: authorFromPopulated(s.userId),
        likeCount: likeCount.get(sid) ?? 0,
        commentCount: commentCount.get(sid) ?? 0,
        likedByMe: likedIds.has(sid),
        savedByMe: savedIds.has(sid),
        ownerId: ownerIdFromSummaryUserField(s.userId),
      };
    })
    .filter(Boolean);

  res.json({ items, hasMore: bookmarks.length === limit });
});

export default router;
