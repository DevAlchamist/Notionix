import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { mergeCorsHeaders } from "./cors";

export async function withDb(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    await connectMongoose();
    const res = await handler();
    return mergeCorsHeaders(res, request);
  } catch (err) {
    console.error(err);
    return mergeCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      request,
    );
  }
}
