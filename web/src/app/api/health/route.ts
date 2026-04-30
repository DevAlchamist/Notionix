import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { mergeCorsHeaders } from "@/lib/api/cors";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return mergeCorsHeaders(NextResponse.json({ status: "ok" }), request);
}
