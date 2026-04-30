import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { Tag } from "@/server/models/Tag";
import { Summary } from "@/server/models/Summary";

export const runtime = "nodejs";

function escapeRegex(raw: string): string {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function GET(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = String(request.nextUrl.searchParams.get("query") ?? "")
      .replace(/^#/, "")
      .trim()
      .replace(/\s+/g, " ");
    const rawLimit = parseInt(String(request.nextUrl.searchParams.get("limit") ?? "10"), 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 10;

    const userObjectId =
      mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    if (!userObjectId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const popularAgg = await Summary.aggregate([
        { $match: { userId: userObjectId } },
        { $unwind: "$tags" },
        {
          $group: {
            _id: "$tags",
            count: { $sum: 1 },
            lastUsedAt: { $max: "$updatedAt" },
          },
        },
        { $sort: { count: -1, lastUsedAt: -1 } },
        { $limit: limit },
      ]);

      const popularIds = popularAgg
        .map((r: { _id: mongoose.Types.ObjectId }) => r._id)
        .filter(Boolean);

      const tagRowsById = new Map<string, { id: string; name: string; color?: string }>();
      if (popularIds.length) {
        const docs = await Tag.find({ userId: userObjectId, _id: { $in: popularIds } })
          .select("_id name color")
          .lean();
        for (const t of docs) {
          const id = t._id.toString();
          tagRowsById.set(id, { id, name: t.name, color: t.color });
        }
      }

      const popularItems = popularAgg
        .map((r: { _id: mongoose.Types.ObjectId; count: number }) => {
          const id = r._id?.toString?.() ?? "";
          const tag = tagRowsById.get(id);
          if (!tag) return null;
          return { ...tag, count: r.count };
        })
        .filter(Boolean) as Array<{ id: string; name: string; color?: string; count: number }>;

      let matchItems: Array<{ id: string; name: string; color?: string }> = [];
      if (q) {
        const rx = new RegExp(escapeRegex(q), "i");
        const docs = await Tag.find({ userId: userObjectId, name: rx })
          .sort({ name: 1 })
          .limit(limit)
          .select("_id name color")
          .lean();
        matchItems = docs.map((t) => ({
          id: t._id.toString(),
          name: t.name,
          color: t.color,
        }));
      }

      const seen = new Set<string>();
      const merged: Array<{ id: string; name: string; color?: string; count?: number }> = [];

      for (const item of matchItems) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
        if (merged.length >= limit) break;
      }

      if (merged.length < limit) {
        for (const item of popularItems) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          merged.push(item);
          if (merged.length >= limit) break;
        }
      }

      return NextResponse.json({ items: merged });
    } catch {
      return NextResponse.json({ error: "Failed to suggest tags" }, { status: 500 });
    }
  });
}
