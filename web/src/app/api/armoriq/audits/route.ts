import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { ArmorIqAuditLog } from "@/server/models/ArmorIqAuditLog";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawLimit = Number(request.nextUrl.searchParams.get("limit") || "100");
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 100, 1), 300);

    const rows = await ArmorIqAuditLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({
      items: rows.map((row) => ({
        id: row._id.toString(),
        createdAt: row.createdAt,
        mode: row.mode,
        emittedOk: row.emittedOk,
        reason: row.reason,
        userEmail: row.userEmail,
        event: row.event,
      })),
    });
  });
}

