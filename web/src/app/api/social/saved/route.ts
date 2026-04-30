import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { SavedSummary } from "@/server/models/SavedSummary";
import { Summary } from "@/server/models/Summary";
import {
  authorFromPopulated,
  engagementMapsForSummaries,
  ownerIdFromSummaryUserField,
  previewText,
} from "@/server/social/utils";

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
    const skip = Math.max(parseInt(String(request.nextUrl.searchParams.get("skip") || "0"), 10) || 0, 0);

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

    return NextResponse.json({ items, hasMore: bookmarks.length === limit });
  });
}
