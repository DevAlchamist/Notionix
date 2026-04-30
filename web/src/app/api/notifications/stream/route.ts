import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { corsHeadersForRequest } from "@/lib/api/cors";
import { getUserIdFromRequest } from "@/server/auth/request";
import { unreadCount } from "@/server/notifications/store";
import { sseAddClient, sseRemoveClient, type SSEClient } from "@/server/notifications/sseHub";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let keepAlive: ReturnType<typeof setInterval> | undefined;
  let sseClient: SSEClient | null = null;

  const cleanup = () => {
    if (keepAlive) {
      clearInterval(keepAlive);
      keepAlive = undefined;
    }
    if (sseClient) {
      sseRemoveClient(userId, sseClient);
      sseClient = null;
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      sseClient = {
        write: (chunk: string) => {
          try {
            controller.enqueue(encoder.encode(chunk));
          } catch {
            // stream may be closed
          }
        },
      };

      sseAddClient(userId, sseClient);

      void unreadCount(userId).then((unread) => {
        sseClient?.write(`event: unread\n`);
        sseClient?.write(`data: ${JSON.stringify({ unread })}\n\n`);
      });

      keepAlive = setInterval(() => {
        sseClient?.write(":\n\n");
      }, 25000);

      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  const headers = new Headers();
  headers.set("Content-Type", "text/event-stream");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");
  corsHeadersForRequest(request).forEach((v, k) => headers.set(k, v));

  return new NextResponse(stream, { headers });
}
