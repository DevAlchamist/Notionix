import mongoose from "mongoose";
import { Summary } from "../models/Summary";
import { SummaryLike } from "../models/SummaryLike";
import { SummaryComment } from "../models/SummaryComment";
import { SavedSummary } from "../models/SavedSummary";
import type { SummaryVisibility } from "../models/Summary";

export function normalizeVisibility(value: unknown): SummaryVisibility {
  if (value === "public" || value === "private") return value;
  return "private";
}

export type PublicSummaryAccess =
  | { ok: true; doc: { _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId } }
  | { ok: false; httpStatus: 404 | 403 };

export async function getPublicSummaryAccess(summaryId: string): Promise<PublicSummaryAccess> {
  if (!mongoose.isValidObjectId(summaryId)) {
    return { ok: false, httpStatus: 404 };
  }

  const doc = await Summary.findById(summaryId).select("_id userId visibility").lean();
  if (!doc) {
    return { ok: false, httpStatus: 404 };
  }
  if (normalizeVisibility(doc.visibility) !== "public") {
    return { ok: false, httpStatus: 403 };
  }
  return { ok: true, doc: doc as { _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId } };
}

export function previewText(text: string, max = 400): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export function authorFromPopulated(userId: unknown): { id: string; name: string; avatar?: string } {
  if (userId && typeof userId === "object" && "_id" in userId) {
    const u = userId as { _id: mongoose.Types.ObjectId; name?: string; avatar?: string };
    const base = { id: u._id.toString(), name: u.name ?? "User" };
    return u.avatar !== undefined && u.avatar !== "" ? { ...base, avatar: u.avatar } : base;
  }
  return { id: "", name: "User" };
}

export function ownerIdFromSummaryUserField(userIdField: unknown): string | undefined {
  if (!userIdField) return undefined;
  if (typeof userIdField === "object" && "_id" in userIdField) {
    return String((userIdField as { _id: mongoose.Types.ObjectId })._id);
  }
  if (userIdField instanceof mongoose.Types.ObjectId) {
    return userIdField.toString();
  }
  return undefined;
}

export async function engagementMapsForSummaries(
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
