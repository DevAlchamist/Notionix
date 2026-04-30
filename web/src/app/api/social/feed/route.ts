import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
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

    const items = await Summary.find({ visibility: "public" })
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const ids = items.map((s) => s._id.toString());
    const { likeCount, commentCount, likedIds, savedIds } = await engagementMapsForSummaries(ids, userId);

    return NextResponse.json({
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
}
