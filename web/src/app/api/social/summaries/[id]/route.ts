import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { Summary } from "@/server/models/Summary";
import "@/server/models/Tag";
import {
  authorFromPopulated,
  engagementMapsForSummaries,
  getPublicSummaryAccess,
} from "@/server/social/utils";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export function GET(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const access = await getPublicSummaryAccess(id);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.httpStatus === 403 ? "Forbidden" : "Not found" },
        { status: access.httpStatus },
      );
    }
    const pub = access.doc;

    const doc = await Summary.findById(id).populate("userId", "name avatar").populate("tags", "name color").lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { likeCount, commentCount, likedIds, savedIds } = await engagementMapsForSummaries([id], userId);

    return NextResponse.json({
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
}
