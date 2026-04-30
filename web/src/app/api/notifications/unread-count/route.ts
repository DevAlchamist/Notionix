import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withDb } from "@/lib/api/withDb";
import { getUserIdFromRequest } from "@/server/auth/request";
import { unreadCount } from "@/server/notifications/store";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return withDb(request, async () => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const unread = await unreadCount(userId);
    return NextResponse.json({ unread });
  });
}
