import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { Summary } from "@/server/models/Summary";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export function GET(request: NextRequest, ctx: Ctx) {
  return withDb(request, async () => {
    const { id } = await ctx.params;
    const doc = await Summary.findOne({
      _id: id,
      $or: [{ shareEnabled: true }, { visibility: "public" }],
    }).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      platform: doc.platform,
      summaryText: doc.summaryText,
      url: doc.url,
      createdAt: doc.createdAt,
    });
  });
}
